import { BufReader } from "https://deno.land/std@0.88.0/io/bufio.ts";
import { decodeString as hexdecode } from "https://deno.land/std@0.88.0/encoding/hex.ts";
import { varnum } from "https://deno.land/std@0.88.0/encoding/binary.ts";
import { equals } from "https://deno.land/std@0.88.0/bytes/mod.ts";
import { parse } from "https://deno.land/std@0.88.0/flags/mod.ts";
import { concat } from "https://deno.land/std@0.88.0/bytes/mod.ts";

var args = parse(Deno.args);

if(args.h || args.help || args.v || args.version || !args.s || !args.p){
    console.log("$ testbrook -s 1.2.3.4:9999 -p password");
    console.log("$ testbrook -s ws://1.2.3.4:9999 -p password");
    console.log("$ testbrook -s wss://domain.com:443 -p password");
    Deno.exit(0);
}

var p = Deno.run({
    cmd: ["sh", "-c", `which brook`],
    stdout: "null",
});
var s = await p.status();
if(s.code != 0){
    console.log(red(`Please install brook CLI first, such as: $ nami install brook`))
    Deno.exit(s.code);
}

var bp;
var brook = async () => {
    console.log("Starting brook")
    var c = `brook client -s ${args.s} -p ${args.p}`;
    if(args.s.startsWith("ws://")){
        c = `brook wsclient -s ${args.s} -p ${args.p}`;
    }
    if(args.s.startsWith("wss://")){
        c = `brook wssclient -s ${args.s} -p ${args.p}`;
    }
    bp = Deno.run({
        cmd: ["sh", "-c", c],
    });
    var s = await bp.status();
    console.log("Stopped brook")
    Deno.exit(s.code);
}
var stopbrook = async () => {
    console.log("Stopping brook");
    try{
        bp.kill(Deno.Signal.SIGTERM);
        await new Promise(r => setTimeout(r, 3000));
    }catch(e){
    }
}

brook();
await new Promise(r => setTimeout(r, 3000));

try{
    console.log("Testing TCP")
    var c = await Deno.connect({ hostname: "127.0.0.1", port: 1080, transport: "tcp" });
    var r = await new BufReader(c);
    // For convenience, we create a new buffer every time
    var b = new Uint8Array([0x05, 0x01, 0x00]);
    if(args.u && args.p){
        b[2] = 0x02;
    }
    await c.write(b);
    var b1 = new Uint8Array(2);
    await r.readFull(b1);
    if (b1[0] != 0x05){
        console.log("Error:", "server is not socks version 5");
        await stopbrook();
        Deno.exit(1);
    }
    if (b1[1] != b[2]){
        console.log("Error:", "server does not support method", b[2]);
        await stopbrook();
        Deno.exit(1);
    }
    if(b[2] == 0x02){
        b = new Uint8Array([0x01]);
        var u = new TextEncoder().encode(args.u);
        b = concat(b, new Uint8Array([u.length]));
        b = concat(b, u);
        var p = new TextEncoder().encode(args.p);
        b = concat(b, new Uint8Array([p.length]));
        b = concat(b, p);
        await c.write(b);
        b = new Uint8Array(2);
        await r.readFull(b);
        if (b[1] != 0x00){
            console.log("Error:", "invalid username or password");
            await stopbrook();
            Deno.exit(1);
        }
    }
    b = new Uint8Array([0x05, 0x01, 0x00, 0x01, 0x08, 0x08, 0x08, 0x08, 0x00, 0x35]);
    await c.write(b);
    b = new Uint8Array(4);
    await r.readFull(b);
    if(b[1] != 0x00){
        console.log("Error:", "Rep is not success");
        await stopbrook();
        Deno.exit(1);
    }
    if(b[3] == 0x01){
        var b1 = new Uint8Array(6);
        await r.readFull(b1);
    }
    if(b[3] == 0x04){
        console.log("Error:", "This script does not support IPv6");
        await stopbrook();
        Deno.exit(1);
    }
    if(b[3] == 0x03){
        var b1 = new Uint8Array(1);
        await r.readFull(b1);
        b1 = new Uint8Array(b1[0]+2);
        await r.readFull(b1);
    }
    b = hexdecode("00200001010000010000000000000a74787468696e6b696e6703636f6d0000010001");
    await c.write(b);
    b = new Uint8Array(65507);
    var i = await r.read(b);
    c.close();
    if(equals(b.slice(i-4, i), new Uint8Array([0x68, 0xc7, 0x8b, 0x17]))){
        console.log("OK:", "TCP response is OK");
    }else{
        console.log("Warning", "TCP response is not expected");
    }
}catch(e){
    console.log("Error:", e)
    await stopbrook();
    Deno.exit(1);
}

try{
    console.log("Testing UDP")
    var c = await Deno.connect({ hostname: "127.0.0.1", port: 1080, transport: "tcp" });
    var r = await new BufReader(c);
    var b = new Uint8Array([0x05, 0x01, 0x00]);
    if(args.u && args.p){
        b[2] = 0x02;
    }
    await c.write(b);
    var b1 = new Uint8Array(2);
    await r.readFull(b1);
    if (b1[0] != 0x05){
        console.log("Error:", "server is not socks version 5");
        await stopbrook();
        Deno.exit(1);
    }
    if (b1[1] != b[2]){
        console.log("Error:", "server does not support method", b[2]);
        await stopbrook();
        Deno.exit(1);
    }
    if(b[2] == 0x02){
        b = new Uint8Array([0x01]);
        var u = new TextEncoder().encode(args.u);
        b = concat(b, new Uint8Array([u.length]));
        b = concat(b, u);
        var p = new TextEncoder().encode(args.p);
        b = concat(b, new Uint8Array([p.length]));
        b = concat(b, p);
        await c.write(b);
        b = new Uint8Array(2);
        await r.readFull(b);
        if (b[1] != 0x00){
            console.log("Error:", "invalid username or password");
            await stopbrook();
            Deno.exit(1);
        }
    }
    b = new Uint8Array([0x05, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    await c.write(b);
    b = new Uint8Array(4);
    await r.readFull(b);
    if(b[1] != 0x00){
        console.log("Error:", "Rep is not success");
        await stopbrook();
        Deno.exit(1);
    }
    var h, p;
    if(b[3] == 0x01){
        var b1 = new Uint8Array(4);
        await r.readFull(b1);
        h = b1.join(".");
        b1 = new Uint8Array(2);
        await r.readFull(b1);
        p = varnum(b1, {dataType: "uint16", endian: "big"});
    }
    if(b[3] == 0x04){
        console.log("Error:", "This script does not support IPv6");
        await stopbrook();
        Deno.exit(1);
    }
    if(b[3] == 0x03){
        var b1 = new Uint8Array(1);
        await r.readFull(b1);
        b1 = new Uint8Array(b1[0]);
        await r.readFull(b1);
        h = new TextDecoder("utf-8").decode(b1);
        b1 = new Uint8Array(2);
        await r.readFull(b1);
        p = varnum(b1, {dataType: "uint16", endian: "big"});
    }
    var c1 = Deno.listenDatagram({hostname: c.localAddr.hostname, port: c.localAddr.port, transport: "udp"});
    b = hexdecode("000000010808080800350001010000010000000000000a74787468696e6b696e6703636f6d0000010001");
    await c1.send(b, {transport: "udp", hostname: h, port: p});
    b = new Uint8Array(65507);
    var l = await c1.receive(b);
    c1.close();
    c.close();
    if(equals(l[0].slice(-4), new Uint8Array([0x68, 0xc7, 0x8b, 0x17]))){
        console.log("OK:", "UDP response is OK");
    }else{
        console.log("Warning", "UDP response is not expected");
    }
}catch(e){
    console.log("Error:", e)
    await stopbrook();
    Deno.exit(1);
}

await stopbrook();
