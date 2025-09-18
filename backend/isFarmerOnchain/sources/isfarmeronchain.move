#[allow(lint(public_entry))]
module isfarmeronchain::isfarmeronchain{
    use sui::event;

    public struct FarmerIdAdded has copy, drop{
        hash: vector<u8>
    }

    public struct FarmerIdExists has copy, drop{
        hash: vector<u8>
    }

    public struct FarmerIdNotFound has copy, drop{
        hash: vector<u8>
    }

    public struct FarmerStore has key{
        id: sui::object::UID,
        hashes: vector<vector<u8>>
    }

    fun init(ctx: &mut sui::tx_context::TxContext){
        sui::transfer::share_object(FarmerStore{
            id: sui::object::new(ctx),
            hashes: vector::empty<vector<u8>>()
        });
    }

    public entry fun addFarmerId(
        storage: &mut FarmerStore,
        hash: vector<u8>,
        _ctx: &mut sui::tx_context::TxContext){

            vector::push_back(&mut storage.hashes, hash);
            event::emit( FarmerIdAdded{ hash });

        }


    public entry fun verifyFarmerId(
        storage: &mut FarmerStore,
        hash: vector<u8>,
        _ctx: &mut sui::tx_context::TxContext){

            if(vector::contains(&storage.hashes, &hash)){
                event::emit( FarmerIdExists{hash} );
            }
            else{
                event::emit( FarmerIdNotFound{hash} );

            }
            
            

        }
}



