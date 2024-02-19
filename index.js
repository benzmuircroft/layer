process.traceProcessWarnings = true;

process.on('error', function(e) { console.trace(e); });

const pngDrive = async (_options) => {
  const options = { ..._options };
  return new Promise((resolve) => {
    ;(async function() {
      const Hyperdrive = require('hyperdrive');
      const Corestore = require('corestore');
      const Hyperswarm = require('hyperswarm');
      const fs = require('fs').promises;
      const b4a = require('b4a');
      const goodbye = (await import('graceful-goodbye')).default;
      let pngStore;
      if (options.primaryKeyHex) pngStore = new Corestore(options.folder, { primaryKey: b4a.alloc(32, options.primaryKeyHex) });
      else pngStore = new Corestore(options.folder);
      await pngStore.ready();
      let drive;
      if (options.primaryKeyHex) drive = new Hyperdrive(pngStore);
      else drive = new Hyperdrive(pngStore, b4a.from(options.keyHex, 'hex'));
      await drive.ready();
      if (!options.dontSwarmHere) { // todo: test with userbase (hint: load pngDrive first)
        const swarm = new Hyperswarm();
        swarm.on('connection', function(peer) {
          pngStore.replicate(peer);
        });
        const discovery = await swarm.join(b4a.alloc(32).fill(options.topic), { server: true, client: true });
        if (drive.writable) {
          await discovery.flushed();
        }
        else {
          const done = drive.core.findingPeers();
          swarm.flush().then(done, done);
          await drive.core.update({ wait: true });
        }
        goodbye(() => swarm.destroy());
      }
      if (options.debug) console.log(drive.key.toString('hex'));
      if (options.primaryKeyHex) {
        resolve({
          update: !options.dontSwarmHere ? undefined : async function() { // todo: test with userbase (hint: do this after loading pngDrive)
            const anotherTopic = b4a.alloc(32).fill(options.anotherSwarmTopicOrKey); // note: this works with string but not publicKey!
            const discovery = await options.anotherSwarm.join(anotherTopic, { server: true, client: true });
            await discovery.flushed();
          },
          put: async function(location, name) {
            const buffer = await fs.readFile(location);
            await drive.put(name, buffer);
          },
          del: async function(name) {
            await drive.del(name);
          },
          get: async function(name) {
            const buffer = await drive.get(name);
            return `data:image/png;base64,${buffer.toString('base64')}`;
          }
        });
      }
      else {
        resolve({
          update: !options.dontSwarmHere ? undefined : async function() { // todo: test with userbase (hint: do this after loading pngDrive)
            const anotherTopic = b4a.alloc(32).fill(options.anotherSwarmTopicOrKey); // note: this works with string but not publicKey!
            await options.anotherSwarm.join(anotherTopic, { server: true, client: true });
            const done = drive.core.findingPeers();
            options.anotherSwarm.flush().then(done, done);
            await drive.core.update({ wait: true });
          },
          get: async function(name) {
            const buffer = await drive.get(name);
            return `data:image/png;base64,${buffer.toString('base64')}`;
          }
        });
      }
    })();
  });
};

module.exports = pngDrive;
