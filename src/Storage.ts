// defined how to Storage the data
export interface Storage {
  // append a new data to the list
  append(data: any[]): Promise<void>;
}
