import React from 'react';
import { 
  arLessThan,
  getAllowance,
  getBalance, 
  getPoured, 
  getPrice,
  tarDecimals,
  swap,
  tarAddress,
} from '../lib/api';
import { div, mul, pow, myToLocaleString } from '../lib/math';
import BackgroundImg from './background.jpeg';
import { Button, Form, InputNumber, Panel } from 'rsuite';
import { PageLoading } from './PageLoading/PageLoading';

export const Home = (props) => {
  const [formValue, setFormValue] = React.useState({
    amount: undefined,
    total: 'N/A',
    claimed: 'N/A',
    price: 'N/A',
    tarBalance: 'N/A',
    arBalance: 'N/A'
  });

  const fetchInfo = async () => {
    let ret = await getPrice();
    console.log(ret);
    if (ret.status === false) {
      return ret.result;
    }
    setFormValue({...formValue, price: mul(ret.result, pow(10, tarDecimals))});

    ret = await getPoured();
    if (ret.status === false) {
      return ret.result;
    }
    setFormValue({...formValue, claimed: mul(ret.result, pow(10, -tarDecimals))});
    
    ret = await getAllowance();
    if (ret.status === false) {
      return ret.result;
    }
    setFormValue({...formValue, total: mul(ret.result, pow(10, -tarDecimals))});

    return {status: true, result: 'Fetch info succeeded!'};
  };

  React.useEffect(async () => {
    if (props.walletConnect) {
      let ret = await getBalance('ar');
      if (ret.status === true) {
        setFormValue({...formValue, arBalance: ret.result});
      }

      ret = await getBalance(tarAddress);
      if (ret.status === true) {
        setFormValue({...formValue, balance: ret.result});
      }
    }
  }, [props.walletConnect]);

  React.useEffect(async () => {
    
  }, [formValue]);

  const makeSwap = async () => {
    const arStr = mul(formValue.amount, formValue.price).toString();
    if (arLessThan(formValue.arbalance, arStr)) {
      return {status: false, result: 'Insuffient $AR in your wallet!'};
    }
    if (formValue.amount > formValue.allowance) {
      return {status: false, result: 'Claim token exceeds max!'};
    }
    return await swap(arStr);
  }

  if (formValue.total === 'N/A' || formValue.price === 'N/A' || formValue.claimed === 'N/A') {
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
          <Panel header={<div><span>Claim $TAR</span><span><a href=''>(<u>Click to see token info</u>)</a></span></div>} style={{margin: '1rem', background: 'white', width: 400, opacity: 0.85}} shaded>
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
            <Form.Group controlId="price">
              <Form.ControlLabel>Price</Form.ControlLabel>
              <Form.Control name="price" readOnly />
              <Form.HelpText tooltip>Current price of $TAR</Form.HelpText>
            </Form.Group>
            <Form.Group controlId="tarBalance">
              <Form.ControlLabel>Balance($TAR)</Form.ControlLabel>
              <Form.Control name="tarBalance" readOnly />
            </Form.Group>
            <Form.Group controlId="amount">
              <Form.ControlLabel>Amount</Form.ControlLabel>
              <Form.Control name="amount" placeholder='Amount of $TAR you swap for' accepter={InputNumber} />
              <Form.HelpText>$AR Balance: {formValue.balance} </Form.HelpText>
              <Form.HelpText>You will swap {myToLocaleString(mul(formValue.amount, formValue.price))} $AR for {myToLocaleString(formValue.amount)} $TAR </Form.HelpText>
            </Form.Group>
            <Form.Group>
              <Button appearance="primary" onClick={makeSwap}>Claim</Button>
            </Form.Group>
          </Form>
          </Panel>
        </div>
      </div>
    </>
  );
};