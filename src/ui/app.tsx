/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';
import * as CompiledContractArtifact from '../../build/contracts/ERC20.json';
import { InteractToEarnWrapper } from '../lib/contracts/InteractToEarnWrapper';
import { CONFIG } from '../config';

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<InteractToEarnWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [addressBalance, setAddressBalance] = useState<number>();
    const [layer2, setLayer2] = useState<string>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [depositValue, setDepositValue] = useState<number | undefined>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [ethereumBalance, setEthereumBalance] = useState<bigint>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [newStoredNumberInputValue, setNewStoredNumberInputValue] = useState<
        number | undefined
    >();

    const ETHProxyContract = '0x5C3757AbA3A865d66fA31Ed4A0b7eac4C6B9A30D';

    useEffect(() => {
        (async () => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            const polyAddress = addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0])
            setPolyjuiceAddress(polyAddress);

            const ETHSUDTContract = new web3.eth.Contract(CompiledContractArtifact.abi as never, ETHProxyContract);

            const balanceETH = BigInt(await ETHSUDTContract.methods.balanceOf(polyAddress).call({from: accounts?.[0]}));
            setEthereumBalance(balanceETH);
        } else {
            setPolyjuiceAddress(undefined);
        }
    })();
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployContract() {
        const _contract = new InteractToEarnWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);

            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function currentBalance() {
        const value = await contract.getBalance(account);
        toast('Successfully got your current balance.', { type: 'success' });

        setAddressBalance(value);
    }

    async function depositContract() {
        try {
            setTransactionInProgress(true);
            await contract.Deposit(newStoredNumberInputValue, account);
            toast(
                'Sent money to contact.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            await currentBalance();
            setTransactionInProgress(false);
        }
    }

    async function withdrawBalance() {
        try {
            setTransactionInProgress(true);
            await contract.withdrawMoney(newStoredNumberInputValue, account);
            toast(
                'Successfully withdrew funds from contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            await currentBalance();
            setTransactionInProgress(false);
        }
    }

    async function farmBalance() {
        try {
            setTransactionInProgress(true);
            await contract.farmBalance(account);
            toast(
                'Successfully farms your funds that are in the contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            await currentBalance();
            setTransactionInProgress(false);
        }
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new InteractToEarnWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setDepositValue(undefined);
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);

                const addressTranslator = new AddressTranslator();
                const newLayer2 = (await addressTranslator.getLayer2DepositAddress(_web3, _accounts[0])).addressString;
                setLayer2(newLayer2);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
        With this application you can simulate a clicker game. Just follow these few simple steps.
        <br />
        <br />
        <ol>
        <li>First Deploy the contract</li>
        <br />
        <br />
        <button onClick={deployContract} disabled={!l2Balance}>
            Deploy contract
        </button>
        &nbsp;or&nbsp;
        <input
            placeholder="Existing contract id"
            onChange={e => setExistingContractIdInputValue(e.target.value)}
        />
        <button 
        disabled={!existingContractIdInputValue || !l2Balance}
        onClick={() => setExistingContractAddress(existingContractIdInputValue)}>
            Use existing contract
        </button>
        <br />
        <br />
        <li> Now deposit a value into the contract.</li>
        <br />
        <br />
        <input type="number" onChange={e => setNewStoredNumberInputValue(parseInt(e.target.value, 10))}/>
        <button onClick={depositContract} disabled={!contract}>
            Deposit into contract
        </button>
        <br />
        <br />
        <li>You can view your current balance in the contract with this button below</li>
        <br />
        <button onClick={currentBalance} disabled={!contract}>View Balance</button>
            {addressBalance ? <>&nbsp;&nbsp; <br/>Current contract balance: {addressBalance.toString()}</> : null}
        <br />
        <br/>
        <li> You can now farm this balance and increase it by a lot. Every time you farm your balance it increases by 30%.
        That ends up being a lot if you keep clicking.
        <br />
        Make sure to check your balance after you click a lot.
        </li>
        <br />
        <br />
        <button onClick={farmBalance} disabled={!contract}>
            Farm Balance
        </button>
        <br />
        <br />
        <li>Finally it is time to withdraw, you finished clicking and your balance is massive. Type how much you wish to withdraw from the contract.
        <br />
        Remember to withdraw less than or equal to your current balance, no cheating!
        </li>
        <br />
        <br />
        <input type="number" onChange={e => setNewStoredNumberInputValue(parseInt(e.target.value, 10))}/>
        <button onClick={withdrawBalance} disabled={!contract}>
            Withdraw Balance
        </button>
        <br />
        <br />
        You can also use the Force Bridge using this site here:<br />
        <a href={`https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos?xchain-asset=0x0000000000000000000000000000000000000000`}target="_blank">
            Click to go Bridge
        </a>
        <br />
        Use this layer 2 deposit address and use this as the destination address on the force bridge. Come back when your done to see your updated balance below.
        <br />
        <br />
        The Layer 2 Deposit Address: <b>{layer2 || ' - '}</b>
        <hr />
        Now your wallet details
        Your ETH address: <b>{accounts?.[0]}</b>
        <br />
        <br />
        Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
        <br />
        <br />
        Nervos Layer 2 ETH balance:{' '}
        <b>{ethereumBalance ? ((Number (ethereumBalance) / (10 ** 18))).toString () : <LoadingIndicator/>}ETH</b>
        <br />
        <br />
        Nervos Layer 2 balance:{' '}
        <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
        <br />
        <br />
        Deployed contract address: <b>{contract?.address || '-'}</b> <br />
        Deploy transaction hash: <b>{deployTxHash || '-'}</b>
        <br />
        </ol>
        </div>
    );
}