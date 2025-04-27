import { Data, toText } from "@lucid-evolution/lucid";

export type MultiConstructor = {
  Constr1?: "Constr1";
  Constr2?: bigint;
  Constr3?: { field1: string; field2: boolean; };
};

export function deserialise(cbor: string): MultiConstructor {
  const fromCBOR = Data.from(cbor);

  const dataJSON = JSON.stringify(fromCBOR, (_, v) => {
    return typeof v === "bigint" ? v.toString() : v; // BigInt serializer
  });

  const { index, fields } = JSON.parse(dataJSON);

  switch (index) {
    case 0:
      return { Constr1: "Constr1" };

    case 1:
      return { Constr2: BigInt(fields[0]) };

    case 2:
      return { Constr3: { field1: toText(fields[0]), field2: fields[1].index === 1 } };

    default:
      throw "Invalid Index";
  }
}

export function test() {
  const fromAiken = {
    c1: "D87980",
    c2: "D87A9F0AFF",
    c3: "D87B9F46616263646566D87A80FF",
  };

  const c1 = deserialise(fromAiken.c1);
  const c2 = deserialise(fromAiken.c2);
  const c3 = deserialise(fromAiken.c3);

  console.log({ c1, c2, c3 });
}
