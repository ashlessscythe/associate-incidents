declare module "xlsx-populate" {
  interface Workbook {
    sheet(index: number): Sheet;
    outputAsync(): Promise<Uint8Array>;
  }

  interface Sheet {
    cell(ref: string): Cell;
  }

  interface Cell {
    value(value?: any): any;
  }

  function fromFileAsync(path: string): Promise<Workbook>;

  export = {
    fromFileAsync,
  };
}
