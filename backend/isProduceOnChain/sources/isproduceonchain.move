#[allow(lint(public_entry))]
module isproduceonchain::isproduceonchain{
    use sui::event;

    public struct ProduceIdAdded has copy, drop{
        hash: vector<u8>
    }

    public struct ProduceIdExists has copy, drop{
        hash: vector<u8>
    }

    public struct ProduceIdNotFound has copy, drop{
        hash: vector<u8>
    }

    public struct ProduceStore has key{
        id: sui::object::UID,
        hashes: vector<vector<u8>>
    }

    fun init(ctx: &mut sui::tx_context::TxContext){
        sui::transfer::share_object(ProduceStore{
            id: sui::object::new(ctx),
            hashes: vector::empty<vector<u8>>()
        });
    }

    public entry fun addProduceId(
        storage: &mut ProduceStore,
        hash: vector<u8>,
        _ctx: &mut sui::tx_context::TxContext){

            vector::push_back(&mut storage.hashes, hash);
            event::emit( ProduceIdAdded{ hash });

        }


    public entry fun verifyProduceId(
        storage: &mut ProduceStore,
        hash: vector<u8>,
        _ctx: &mut sui::tx_context::TxContext){

            if(vector::contains(&storage.hashes, &hash)){
                event::emit( ProduceIdExists{hash} );
            }
            else{
                event::emit( ProduceIdNotFound{hash} );

            }
            
            

        }
}



