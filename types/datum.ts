import { Data } from "@lucid-evolution/lucid";

// const myDatum = new Constr(0, [
//   fromText("beneficiary"),
//   1745683200000n
// ]);

export const MyDatumSchema =

  Data.Object({
    beneficiary: Data.Bytes(),
    deadline: Data.Integer(),
  });

export type MyDatumType = Data.Static<typeof MyDatumSchema>;
export const MyDatumType = MyDatumSchema as unknown as MyDatumType;
