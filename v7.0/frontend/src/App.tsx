import { ReactElement } from 'react';
import styled from 'styled-components';
import { ActivateDeactivate } from './components/ActivateDeactivate';
import { SectionDivider } from './components/SectionDivider';
import { WalletStatus } from './components/WalletStatus';
import { ContractDeployment } from './components/ContractDeployment';
import { ContractInfo } from './components/ContractInfo';
import { Bidding } from './components/Bidding';

const StyledAppDiv = styled.div`
  display: grid;
  grid-gap: 20px;
`;

export function App(): ReactElement {
  return (
    <StyledAppDiv>
      <ActivateDeactivate />
      <SectionDivider />
      <WalletStatus />
      <SectionDivider />
      <ContractDeployment />
      <SectionDivider />
      <ContractInfo />
      <SectionDivider />
      <Bidding />
    </StyledAppDiv>
  );
}
