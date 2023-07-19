import { useWeb3React } from '@web3-react/core';
import { Contract, ethers, Signer } from 'ethers';
import {
    ChangeEvent,
    MouseEvent,
    ReactElement,
    useEffect,
    useState
} from 'react';
import styled from 'styled-components';
import { Provider } from '../utils/provider';

// Contract ABI and Bytecode
import AuctionArtifact from '../artifacts/contracts/Auction.sol/BasicDutchAuction.json';

const StyledSectionDiv = styled.div`
  display: grid;
  grid-template-columns: 185px 2.5fr 1fr;
  grid-gap: 10px;
  place-self: center;
  align-items: center;
`;

const StyledLabel = styled.label`
  font-weight: bold;
`;

const StyledInput = styled.input`
  padding: 0.4rem 0.6rem;
  line-height: 2fr;
`;

const StyledButton = styled.button`
  width: 180px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
`;

export function ContractDeployment(): ReactElement {
    const context = useWeb3React<Provider>();
    const { library, active } = context;

    const [signer, setSigner] = useState<Signer>();
    const [auctionContract, setAuctionContract] = useState<Contract>();
    const [auctionContractAddr, setAuctionContractAddr] = useState<string>('');
    const [reservePrice, setReservePrice] = useState<string>('');
    const [numBlocksAuctionOpen, setNumBlocksAuctionOpen] = useState<string>('');
    const [offerPriceDecrement, setOfferPriceDecrement] = useState<string>('');
    const [initialPrice, setInitialPrice] = useState<string>('');

    useEffect((): void => {
        if (!library) {
            setSigner(undefined);
            return;
        }

        setSigner(library.getSigner());
    }, [library]);



    function handleDeployContract(event: MouseEvent<HTMLButtonElement>) {
        event.preventDefault();

        if (auctionContract || !signer) {
            return;
        }
        if (!reservePrice) {
            window.alert('Please enter a reserve price');
            return;
        }
        if (!numBlocksAuctionOpen) {
            window.alert('Please enter the number of blocks');
            return;
        }
        if (!offerPriceDecrement) {
            window.alert('Please enter an offer price decrement');
            return;
        }

        async function deployAuctionContract(signer: Signer): Promise<void> {
            const Auction = new ethers.ContractFactory(
                AuctionArtifact.abi,
                AuctionArtifact.bytecode,
                signer
            );

            try {
                const _auctionContract = await Auction.deploy(
                    reservePrice,
                    numBlocksAuctionOpen,
                    offerPriceDecrement
                );

                await _auctionContract.deployed();
                setAuctionContract(_auctionContract);

                const _initialPrice = await _auctionContract.initialPrice();
                const _auctionContractAddress = _auctionContract.address;

                window.alert(`Auction deployed to: ${_auctionContractAddress} with initial price: ${_initialPrice}`);

                setAuctionContractAddr(_auctionContractAddress);
                setInitialPrice(_initialPrice.toString());


            } catch (error: any) {
                window.alert(
                    'Error!' + (error && error.message ? `\n\n${error.message}` : '')
                );
            }
        }

        deployAuctionContract(signer);
    }

    return (
        <>
            <StyledSectionDiv>
                <StyledLabel>Reserve Price</StyledLabel>
                <StyledInput
                    id="reservePriceInput"
                    type="number"
                    min="0"
                    placeholder="Enter reserve price in Wei, eg. 10,000"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        event.preventDefault();
                        setReservePrice(event.target.value)
                    }
                    }
                />
                <div></div>
                <StyledLabel>Num Blocks Auction Open</StyledLabel>
                <StyledInput
                    id="numBlocksAuctionOpenInput"
                    type="number"
                    min="0"
                    placeholder="Enter the number of blocks that auction is open, eg. 1000"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        event.preventDefault();
                        setNumBlocksAuctionOpen(event.target.value)
                    }
                    }
                />
                <div></div>
                <StyledLabel>Offer Price Decrement</StyledLabel>
                <StyledInput
                    id="offerPriceDecrementInput"
                    type="number"
                    min="0"
                    placeholder="Enter offer price decrement in Wei"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        event.preventDefault();
                        setOfferPriceDecrement(event.target.value)
                    }
                    }
                />
                <StyledButton
                    disabled={!active || auctionContract ? true : false}
                    style={{
                        cursor: !active || auctionContract ? 'not-allowed' : 'pointer',
                        borderColor: !active || auctionContract ? 'unset' : 'blue'
                    }}
                    onClick={handleDeployContract}
                >
                    Deploy Auction Contract
                </StyledButton>
                <StyledLabel>Contract Address</StyledLabel>
                <div>
                    {auctionContractAddr ? (
                        auctionContractAddr
                    ) : (
                        <em>{`<Contract not yet deployed>`}</em>
                    )}
                </div>
                <div></div>
                <StyledLabel>Inital Price</StyledLabel>
                <div>
                    {initialPrice ? (
                        initialPrice
                    ) : (
                        <em>{`<Contract not yet deployed>`}</em>
                    )}
                </div>
                <div></div>
            </StyledSectionDiv>
        </>
    );
}
