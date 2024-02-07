# 🕳🥊 Autojar 🫙
A shared object that each user has a part in but can be replaced by others by transferring the role to the first in-line user

```js

const autojar = {
  hyperswarm, // replication and rpc
  servers: {}, // serverPublicKey \/ each join each other
  clients: {}, // clientPublicKey /\
  status: {} // if a store should be replaced (an autobase of all the users who have ever had roles)
  concensus: {} // joint oppinion (offline users dont count)
  stores: {
    a: store,
    b: store
  },
  methods: {} // things they can do together
};
```
