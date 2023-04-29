import React from 'react';
import { 
  arLessThan,
  getAllowance,
  getBalance, 
  getPoured, 
  tarDecimals,
  swap,
  tarAddress,
} from '../lib/api';
import { div, mul, pow, myToLocaleString } from '../lib/math';
import BackgroundImg from './background.jpeg';
import { Button, Form, InputNumber, Panel } from 'rsuite';
import { PageLoading } from './PageLoading/PageLoading';
import { SubmitButton } from './SubmitButton/SubmitButton';

export const Home = (props) => {
  const [formValue, setFormValue] = React.useState({
    total: 'N/A',
    claimed: 'N/A',
    tarBalance: 'N/A',
    arBalance: 'N/A'
  });

  const fetchInfo = async () => {
    const pouredRet = await getPoured();
    if (pouredRet.status === false) {
      return pouredRet;
    }
    
    const totalRet = await getAllowance();
    if (totalRet.status === false) {
      return totalRet;
    }

    setFormValue({
      ...formValue, 
      total: mul(totalRet.result, pow(10, -tarDecimals)),
      claimed: mul(pouredRet.result, pow(10, -tarDecimals))
    });

    return {status: true, result: 'Fetch info succeeded!'};
  };

  const fetchBalance = async () => {
    const arRet = await getBalance('ar');
    if (arRet.status === false) {
      return;
    }

    const tarRet = await getBalance(tarAddress);
    console.log('debug: ', tarRet);
    if (tarRet.status === false) {
      return;
    }

    setFormValue({
      ...formValue, 
      arBalance: arRet.result,
      tarBalance: mul(tarRet.result, pow(10, -tarDecimals))
    });
  }

  React.useEffect(async () => {
    if (props.walletConnect) {
      fetchBalance();
    }
  }, [props.walletConnect]);

  const makeSwap = async () => {
    // const ret = await swap();
    // await fetchBalance();
    // return ret;
    swap();
    for (let index = 0; index < 100; index++) {
      await sleep(10);
      fetchBalance();
      fetchInfo(); 
    }
    return {status: true, result: '!'};
  }

  if (formValue.total === 'N/A' && formValue.claimed === 'N/A') {
    return (
      <PageLoading
        submitTask={fetchInfo}
      />
    );
  }

  return (
    <>
      <div style={{backgroundImage: `url(${BackgroundImg})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', padding: '1rem'}}>
        <div>
          <Panel header={<div><span>Claim $TAR</span><span><a href={`http://atomic-explorer.marslab.top/token/${tarAddress}`}>(<u>Click to see token info</u>)</a></span></div>} style={{margin: '1rem', background: 'white', width: 400, opacity: 0.85}} shaded>
          <Form formValue={formValue}>
            <Form.Group controlId="total">
              <Form.ControlLabel>Remaining</Form.ControlLabel>
              <Form.Control name="total" readOnly />
              <Form.HelpText tooltip>Total volume remaining in pool</Form.HelpText>
            </Form.Group>
            <Form.Group controlId="claimed">
              <Form.ControlLabel>Claimed</Form.ControlLabel>
              <Form.Control name="claimed" readOnly />
              <Form.HelpText tooltip>Total volume claimed by users</Form.HelpText>
            </Form.Group>
            <Form.Group controlId="tarBalance">
              <Form.ControlLabel>Your Balance($TAR)</Form.ControlLabel>
              <Form.Control name="tarBalance" readOnly />
            </Form.Group>
            <Form.Group>
              <SubmitButton 
                buttonText='Claim $TAR'
                submitTask={makeSwap}
              />
            </Form.Group>
          </Form>
          </Panel>
        </div>
      </div>
    </>
  );
};