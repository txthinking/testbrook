# testbrook

Test TCP and UDP of brook server/wsserver/wssserver

Install via [nami](https://github.com/txthinking/nami)

```
$ nami install brook testbrook
```

Test
```
$ testbrook -s 1.2.3.4:9999 -p password
$ testbrook -s ws://1.2.3.4:9999 -p password
$ testbrook -s wss://domain.com:443 -p password
```
