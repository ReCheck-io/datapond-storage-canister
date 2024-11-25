import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
  'getFile' : ActorMethod<
    [string, string, string, bigint],
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
  'getStatus' : ActorMethod<
    [],
    {
      'status' : { 'stopped' : null } |
        { 'stopping' : null } |
        { 'running' : null },
      'memory_size' : bigint,
      'cycles' : bigint,
      'settings' : {
        'freezing_threshold' : bigint,
        'controllers' : Array<Principal>,
        'reserved_cycles_limit' : bigint,
        'memory_allocation' : bigint,
        'compute_allocation' : bigint,
      },
      'idle_cycles_burned_per_day' : bigint,
      'module_hash' : [] | [Uint8Array | number[]],
      'reserved_cycles' : bigint,
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
  'loadCanisterCode' : ActorMethod<
    [Uint8Array | number[]],
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
  'uploadFile' : ActorMethod<
    [
      {
        'id' : string,
        'content' : Uint8Array | number[],
        'name' : string,
        'size' : bigint,
      },
      string,
      boolean,
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
