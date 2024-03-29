function test1(x) {
  console.log(x instanceof Array);
  console.log(typeof x === "object");
}

const zzz = [1, 2, 3, 4, 5];
test1(zzz);
