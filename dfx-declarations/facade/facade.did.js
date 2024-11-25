export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'getFile' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Nat],
        [
          IDL.Variant({
            'Ok' : IDL.Record({
              'id' : IDL.Text,
              'hasNext' : IDL.Bool,
              'chunk' : IDL.Vec(IDL.Nat8),
              'name' : IDL.Text,
            }),
            'Err' : IDL.Variant({
              'NotKnown' : IDL.Text,
              'InvalidPayload' : IDL.Text,
              'NotFound' : IDL.Text,
              'UploadError' : IDL.Text,
              'Unauthorized' : IDL.Text,
              'Conflict' : IDL.Text,
            }),
          }),
        ],
        ['query'],
      ),
    'getStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'status' : IDL.Variant({
              'stopped' : IDL.Null,
              'stopping' : IDL.Null,
              'running' : IDL.Null,
            }),
            'memory_size' : IDL.Nat,
            'cycles' : IDL.Nat,
            'settings' : IDL.Record({
              'freezing_threshold' : IDL.Nat,
              'controllers' : IDL.Vec(IDL.Principal),
              'reserved_cycles_limit' : IDL.Nat,
              'memory_allocation' : IDL.Nat,
              'compute_allocation' : IDL.Nat,
            }),
            'idle_cycles_burned_per_day' : IDL.Nat,
            'module_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
            'reserved_cycles' : IDL.Nat,
          }),
        ],
        [],
      ),
    'initializeCanister' : IDL.Func(
        [IDL.Principal],
        [
          IDL.Variant({
            'Ok' : IDL.Record({
              'id' : IDL.Principal,
              'createdAt' : IDL.Nat64,
            }),
            'Err' : IDL.Variant({
              'NotKnown' : IDL.Text,
              'InvalidPayload' : IDL.Text,
              'NotFound' : IDL.Text,
              'UploadError' : IDL.Text,
              'Unauthorized' : IDL.Text,
              'Conflict' : IDL.Text,
            }),
          }),
        ],
        [],
      ),
    'loadCanisterCode' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [
          IDL.Variant({
            'Ok' : IDL.Bool,
            'Err' : IDL.Variant({
              'NotKnown' : IDL.Text,
              'InvalidPayload' : IDL.Text,
              'NotFound' : IDL.Text,
              'UploadError' : IDL.Text,
              'Unauthorized' : IDL.Text,
              'Conflict' : IDL.Text,
            }),
          }),
        ],
        [],
      ),
    'uploadFile' : IDL.Func(
        [
          IDL.Record({
            'id' : IDL.Text,
            'content' : IDL.Vec(IDL.Nat8),
            'name' : IDL.Text,
            'size' : IDL.Nat,
          }),
          IDL.Text,
          IDL.Bool,
        ],
        [
          IDL.Variant({
            'Ok' : IDL.Record({
              'id' : IDL.Text,
              'name' : IDL.Text,
              'canisterId' : IDL.Text,
            }),
            'Err' : IDL.Variant({
              'NotKnown' : IDL.Text,
              'InvalidPayload' : IDL.Text,
              'NotFound' : IDL.Text,
              'UploadError' : IDL.Text,
              'Unauthorized' : IDL.Text,
              'Conflict' : IDL.Text,
            }),
          }),
        ],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
