import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
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
  'uploadFile' : ActorMethod<
    [
      {
        'id' : string,
        'content' : Uint8Array | number[],
        'name' : string,
        'size' : bigint,
      },
      boolean,
    ],
    { 'Ok' : boolean } |
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
