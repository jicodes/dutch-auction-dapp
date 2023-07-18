import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import {
    ChangeEvent,
    MouseEvent,
    ReactElement,
    useState
} from 'react';
import styled from 'styled-components';
import { Provider } from '../utils/provider';

// Contract ABI and Bytecode
import AuctionArtifact from '../artifacts/contracts/Auction.sol/BasicDutchAuction.json';
import { get } from 'http';

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

export function ContractInfo(): ReactElement {
    const context = useWeb3React<Provider>();
    const { library, active } = context;

    const [auctionContractAddr, setAuctionContractAddr] = useState<string>('');
    const [winner, setWinner] = useState<string>('');
    const [reservePrice, setReservePrice] = useState<string>('');
    const [numBlocksAuctionOpen, setNumBlocksAuctionOpen] = useState<string>('');
    const [offerPriceDecrement, setOfferPriceDecrement] = useState<string>('');
    const [currentPrice, setCurrentPrice] = useState<string>('');


    function handleShowInfo(event: MouseEvent<HTMLButtonElement>) {
        event.preventDefault();

        if (!library) {
            window.alert('Please connect to a Web3 provider (wallet)');
            return;
        }

        if (!auctionContractAddr) {
            window.alert('Please enter a valid auction contract address');
            return;
        }

        async function getAuctionContract(auctionContractAddr: string) {
            try {
                const _auctionContract = new ethers.Contract(
                    auctionContractAddr,
                    AuctionArtifact.abi,
                    library
                );

                const _winner = await _auctionContract.winner();
                const _reservePrice = await _auctionContract.reservePrice();
                const _numBlocksAuctionOpen = await _auctionContract.numBlocksAuctionOpen();
                const _offerPriceDecrement = await _auctionContract.offerPriceDecrement();
                const _currentPrice = await _auctionContract.currentPrice();

                setWinner(_winner);
                setReservePrice(_reservePrice.toString());
                setNumBlocksAuctionOpen(_numBlocksAuctionOpen.toString());
                setOfferPriceDecrement(_offerPriceDecrement.toString());
                setCurrentPrice(_currentPrice.toString());

            } catch (error: any) {
                window.alert(
                    'Error!' + (error && error.message ? `\n\n${error.message}` : '')
                );
            }
        }
        getAuctionContract(auctionContractAddr);
    }

    return (
        <>
            <StyledSectionDiv>
                <StyledLabel>Contract Address</StyledLabel>
                <StyledInput
                    id="auctionContractAddrInput"
                    type="text"
                    placeholder="Enter the contract address you want to lookup"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setAuctionContractAddr(event.target.value)
                    }
                />
                <StyledButton
                    disabled={!active || !auctionContractAddr}
                    style={{
                        cursor: !active || !auctionContractAddr ? 'not-allowed' : 'pointer',
                        borderColor: !active || !auctionContractAddr ? 'unset' : 'blue'
                    }}
                    onClick={handleShowInfo}
                >
                    Show Info
                </StyledButton>

                <StyledLabel>Winner</StyledLabel>
                <div>
                    {winner === '' ? ('') :
                        winner === ethers.constants.AddressZero ? (<em>{`<No winner yet>`}</em>) : (<span>{winner}</span>)}
                </div>
                <div></div>
                <StyledLabel>Reserve Price</StyledLabel>
                <div>{reservePrice}</div>
                <div></div>
                <StyledLabel>Num Blocks Auction Open</StyledLabel>
                <div>{numBlocksAuctionOpen}</div>
                <div></div>
                <StyledLabel>Offer Price Decrement</StyledLabel>
                <div>{offerPriceDecrement}</div>
                <div></div>
                <StyledLabel>Current Price</StyledLabel>
                <div>{currentPrice}</div>
            </StyledSectionDiv>
        </>
    );
}