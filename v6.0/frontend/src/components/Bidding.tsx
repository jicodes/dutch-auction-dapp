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

export function Bidding(): ReactElement {
    const context = useWeb3React<Provider>();
    const { library, active } = context;

    const [signer, setSigner] = useState<Signer>();
    const [auctionContract, setAuctionContract] = useState<Contract>();
    const [auctionContractAddr, setAuctionContractAddr] = useState<string>('');
    const [bidAmount, setBidAmount] = useState<number>(0);
    const [bidResult, setBidResult] = useState<string>('');
    const [winner, setWinner] = useState<string>('');
    const [isEnded, setIsEnded] = useState<boolean>(false);


    useEffect((): void => {
        if (!library) {
            setSigner(undefined);
            return;
        }
        setSigner(library.getSigner());
    }, [library]);

    useEffect(() => {
        if (auctionContract && signer && bidAmount > 0) {
            submitBid(auctionContract, signer, bidAmount);
        }
    }, [auctionContract, signer, bidAmount]);


    function handleBid(event: MouseEvent<HTMLButtonElement>) {
        event.preventDefault();

        if (!signer) {
            window.alert('Please connect to a Web3 provider (wallet)');
            return;
        }

        if (!auctionContractAddr) {
            window.alert('Please input a valid auction contract address');
            return;
        }
        if (!bidAmount) {
            window.alert('Please enter a bid amount');
            return;
        }
        getAuctionContract(auctionContractAddr);
    }

    async function getAuctionContract(auctionContractAddr: string) {
        try {
            const _auctionContract = new ethers.Contract(
                auctionContractAddr,
                AuctionArtifact.abi,
                library
            );
            setAuctionContract(_auctionContract);
        } catch (error: any) {
            window.alert(
                'Error!' + (error && error.message ? `\n\n${error.message}` : '')
            );
        }
    }
    async function submitBid(auctionContract: Contract, singer: Signer, bidAmount: number): Promise<void> {
        if (isEnded) {
            setBidResult('No accepted anymore. Auction has ended');
            window.alert('No accepted anymore. Auction has ended');
            return;
        }

        try {
            const _bidTxn = await auctionContract.connect(singer).bid({
                value: bidAmount
            });
            await _bidTxn.wait();
            setBidResult('Your bid accepted as the winner');
            window.alert('Bid successful');
            setIsEnded(true);
        } catch (error: any) {
            setBidResult(
                'Bid failed. Please enter the correct contract address and make sure the bid amount is higher than the current price'
            );
            setIsEnded(false);
            window.alert(
                'Error!' + (error && error.message ? `\n\n${error.message}` : '')
            );
        }
    }

    return (
        <>
            <StyledSectionDiv>
                <StyledLabel>Auction Contract Address</StyledLabel>
                <StyledInput
                    id="auctionContractInput"
                    type="text"
                    placeholder="Enter auction contract address"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setAuctionContractAddr(event.target.value)
                    }
                />
                <div></div>
                <StyledLabel>Bid Amount</StyledLabel>
                <StyledInput
                    id="bidAmountInput"
                    type="number"
                    min="0"
                    placeholder="Enter bid amount"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        setBidAmount(event.target.valueAsNumber);
                    }
                    }
                />
                <StyledButton
                    disabled={!active || !auctionContractAddr || !bidAmount}
                    style={{
                        cursor: !active || !auctionContractAddr || !bidAmount ? 'not-allowed' : 'pointer',
                        borderColor: !active || !auctionContractAddr || !bidAmount ? 'unset' : 'blue'
                    }}
                    onClick={handleBid}
                >
                    Bid
                </StyledButton>
                <StyledLabel>Bid Result</StyledLabel>
                <div>{bidResult}</div>
                <div></div>
            </StyledSectionDiv>
        </>
    );
}
