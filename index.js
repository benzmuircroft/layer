process.traceProcessWarnings = true;

process.on('error', function(e) { console.trace(e); });

const Corestore = require('corestore');
const Tinybee = require('tinybee'); // don't use tinybee, instead take the things you need out and impliment queues here acac
const Hyperswarm = require('hyperswarm');
const b4a = require('b4a');
const goodbye = require('graceful-goodbye');
const fs = require('fs').promises;

let store, myLable, swarmOptions, inp = {}, plugs = {}, queues = {}, replugging = false;

async function onUpdate(data, keyPair, onChange, testing) { // this method needs a updating queue so that it awaits get and put properly if this is happening 
  return new Promise((resolve) => {
    // todo: if replugging put in queues['asafe].push([data, keyPair, onChange, testing, resolve])
    ;(async function() {
      console.log(testing, 'data: ', data, 'asafe is:', plugs['asafe']?.db.key.toString('hex'));
      for (const lable in plugs) {
        if (data[lable]?.publicKey != plugs[lable].db.core.key.toString('hex')) {
          console.log(`${testing} deleted ${plugs[lable].db.core.key.toString('hex')}`);
          await plugs[lable].db.close();
          delete plugs[lable];
          if (lable == myLable) onChange('unplugged');
        }
        // GOT IT!! now 2 is the only one who falls here!
        else if (!plugs[lable]?.db.writable && lable == myLable && data[lable]?.publicKey == plugs[lable].db.core.key.toString('hex')) { // it's not writable but it's my lable and my key
          console.log(testing, 'wtf?', plugs[myLable].db.writable ? 'member' : 'observer');
          await plugs[lable].db.close();
          delete plugs[lable];
          if (lable == myLable) onChange('unplugged');
          // 3 and 4 are ok but 2 is not deleting self it's just adding the replacement core ontop of thier myLable core
          // 2 is falling though here! it starts with the correct shit but, ?
          // could it just be getting on the old empty core befor the new one is loaded and the old one is already wiped as null?
          // 2 added theirs
          // 2 added other
          // it never deletes and for some reason has an object in plugs at BEFORE the start
        }
        else console.log(testing, 'HIT!'); // just an observer .. todo: can it read?
      }
      for (const lable in data) {
        // if (testing == 2) console.log('im 2');
        if (!plugs[lable] && data[lable].publicKey !== keyPair?.publicKey.toString('hex')) {
          console.log(`${testing} added other ${data[lable].publicKey}`);
          inp[lable] = store.get({ key: b4a.from(data[lable].publicKey, 'hex') });
          await inp[lable].ready();
          inp[lable].isCore = true; // polyfill
          plugs[lable] = await Tinybee({
            key: b4a.from(data[lable].publicKey, 'hex'),
            folderNameOrCorestore: inp[lable]
          });
          // if (testing == 2) console.log('plugs2', plugs); 
        }
        else if (data[lable].publicKey == keyPair?.publicKey.toString('hex')) {
          console.log(`${testing} added thiers ${keyPair.publicKey.toString('hex')}`);
          inp[myLable] = store.get({ keyPair: keyPair });
          await inp[myLable].ready();
          inp[myLable].isCore = true; // polyfill
          plugs[myLable] = await Tinybee({
            keyPair: keyPair,
            folderNameOrCorestore: inp[myLable]
          });
          onChange('replugged');
        }
      }
      resolve();
    })();
  });
}


const replug = async (options) => {
  const root = options.root;
  const rootKeyVal = options.rootKeyVal;
  const plugsName = options.plugsName;
  const keyPair = options.keyPair;
  const folderName = options.folderName;
  const onChange = options.onChange;
  const testing = options.testing;
  console.log(testing, 'start <<<<<<');
  return new Promise((resolve) => {
    ;(async function(resolve) {
      try { await fs.rm('./' + plugsName, { recursive: true }); } catch (e) {}
      store = new Corestore('./' + plugsName + (testing || ''));
      if (keyPair) {
        myLable = folderName.split('/');
        myLable = myLable[myLable.length - 1];
        swarmOptions = { keyPair };
      }
      const swarm = new Hyperswarm(swarmOptions);
      swarm.on('connection', (peer) => store.replicate(peer));
      const discovery = await swarm.join(b4a.alloc(32).fill(plugsName));
      await discovery.flushed();
      goodbye(() => swarm.destroy());
      const watch = await root.db.getAndWatch(rootKeyVal);
      watch.on('update', async function () {
        const update = await root.get(rootKeyVal);
        await onUpdate(update, keyPair, onChange, testing);
      });
      await onUpdate(await root.get(rootKeyVal), keyPair, onChange, testing);
      console.log(`resolved ${testing}`);
      resolve(plugs);
    })(resolve);
  });
};

module.exports = replug;
