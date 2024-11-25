import { IDL, Principal } from "azle";

export const User = IDL.Record({
  userId: IDL.Text,
  canisters: IDL.Vec(IDL.Text),
  canistersMarkedFull: IDL.Vec(IDL.Text),
});

export interface User {
  userId: string;
  canisters: string[];
  canistersMarkedFull: string[];
}

export const File = IDL.Record({
  id: IDL.Text,
  name: IDL.Text,
  size: IDL.Nat,
  content: IDL.Vec(IDL.Nat8),
  createdAt: IDL.Nat64,
});

export interface File {
  id: string;
  name: string;
  size: bigint;
  content: Uint8Array;
  createdAt: bigint;
}

export const FileChunkResponse = IDL.Record({
  id: IDL.Text,
  name: IDL.Text,
  chunk: IDL.Vec(IDL.Nat8),
  hasNext: IDL.Bool,
});

export interface FileChunkResponse {
  id: string;
  name: string;
  chunk: Uint8Array;
  hasNext: boolean;
}

export const FilePayload = IDL.Record({
  id: IDL.Text,
  name: IDL.Text,
  size: IDL.Nat,
  content: IDL.Vec(IDL.Nat8),
});

export interface FilePayload {
  id: string;
  name: string;
  size: bigint;
  content: Uint8Array;
}

export const FileResponse = IDL.Record({
  id: IDL.Text,
  name: IDL.Text,
  canisterId: IDL.Text,
});

export interface FileResponse {
  id: string;
  name: string;
  canisterId: string;
}

export const Service = IDL.Record({
  id: IDL.Principal,
  createdAt: IDL.Nat64,
});

export interface Service {
  id: Principal;
  createdAt: bigint;
}

export const ErrorType = IDL.Variant({
  Conflict: IDL.Text,
  NotKnown: IDL.Text,
  NotFound: IDL.Text,
  UploadError: IDL.Text,
  Unauthorized: IDL.Text,
  InvalidPayload: IDL.Text,
});

export type ErrorType =
  | { Conflict: string }
  | { NotKnown: string }
  | { NotFound: string }
  | { UploadError: string }
  | { Unauthorized: string }
  | { InvalidPayload: string };

export const ServiceResult = IDL.Variant({ Ok: Service, Err: ErrorType });
export type ServiceResult = { Ok: Service } | { Err: ErrorType };

export const FileResult = IDL.Variant({ Ok: FileResponse, Err: ErrorType });
export type FileResult = { Ok: FileResponse } | { Err: ErrorType };

export const FileChunkResult = IDL.Variant({
  Ok: FileChunkResponse,
  Err: ErrorType,
});
export type FileChunkResult = { Ok: FileChunkResponse } | { Err: ErrorType };

export const BoolResult = IDL.Variant({ Ok: IDL.Bool, Err: ErrorType });
export type BoolResult = { Ok: boolean } | { Err: ErrorType };
