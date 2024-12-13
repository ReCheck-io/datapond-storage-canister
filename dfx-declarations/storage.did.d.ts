import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
  'checkCanisterFreeSpace' : ActorMethod<[bigint], boolean>,
  'getFile' : ActorMethod<
    [string, bigint],
    {
        'Ok' : {
          'id' : string,
          'hasNext' : boolean,
          'chunk' : Uint8Array | number[],
          'name' : string,
        }
      } |
      {
        'Err' : { 'NotKnown' : string } |
          { 'InvalidPayload' : string } |
          { 'NotFound' : string } |
          { 'UploadError' : string } |
          { 'Unauthorized' : string } |
          { 'Conflict' : string }
      }
  >,
  'initializeCanister' : ActorMethod<
    [Principal],
    { 'Ok' : { 'id' : Principal, 'createdAt' : bigint } } |
      {
        'Err' : { 'NotKnown' : string } |
          { 'InvalidPayload' : string } |
          { 'NotFound' : string } |
          { 'UploadError' : string } |
          { 'Unauthorized' : string } |
          { 'Conflict' : string }
      }
  >,
  'uploadFile' : ActorMethod<
    [
      {
        'id' : string,
        'content' : Uint8Array | number[],
        'name' : string,
        'size' : bigint,
      },
      string,
    ],
    { 'Ok' : { 'id' : string, 'name' : string, 'canisterId' : string } } |
      {
        'Err' : { 'NotKnown' : string } |
          { 'InvalidPayload' : string } |
          { 'NotFound' : string } |
          { 'UploadError' : string } |
          { 'Unauthorized' : string } |
          { 'Conflict' : string }
      }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
