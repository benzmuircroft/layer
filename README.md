# 🕳🥊 replug 🔌
A shared object that each user has a part in but can be replaced by others by transferring the role to the first in-line user

```js

const autojar = {
  hyperswarm, // replication and rpc
  servers: {}, // serverPublicKey \/ each join each other
  clients: {}, // clientPublicKey /\
  status: {}, // if a store should be replaced (an autobase of all the users who have ever had roles)
  concensus: {}, // joint oppinion of status (offline users dont count) another autobase
  stores: {
    a: store,
    b: store
  },
  methods: {} // things they can do together
};
```

it should be able to use tinybee fore each store!

the db needs to be swappable like this!


how about:
```js
const root = 'a core with a list'
const services = await require(replug)({ root, rootList: 'cars' });
// inside of replug it watches the roots list of public keys to see updates on services added and swapped writers or destroyed
// and each service is replcated as it's own core and purged if destroyed or swapped
// all of these services are deleted on startup unless you are the service owner
// as the service owner you can be knocked out on replacement  
```
