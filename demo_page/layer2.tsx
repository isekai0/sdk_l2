import React, { useState, useEffect } from 'react';
import {
    Layer2ProviderManager as Manager,
    Layer2Type,
    Transfer,
    Deposit,
    Layer2Provider,
    Layer2Wallet
} from '../src';
import { ethers } from 'ethers';

declare global {
    interface Window {
        ethereum: any;
    }
}

const NETWORK = 'ropsten';
const WORKING_TOKEN = 'ETH';
const DEFAULT_ADDRESS = '0x830baf0080766a88ff70f124f5016efd4af9c025';

const DemoLayer2 = () => {
    const [balance, setBalance] = useState('');
    const [depositData, setDepositData] = useState({
        amount: ''
    });
    const [transferData, setTransferData] = useState({
        onlyCheckFee: true,
        addr: DEFAULT_ADDRESS,
        amount: ''
    });
    const [confirmed, setConfirmed] = useState('N/A');
    const [depositResult, setDepositResult] = useState('-');
    const [l2Provider, setL2Provider] = useState<Layer2Provider>();
    const [l2Wallet, setL2Wallet] = useState<Layer2Wallet>();
    const [walletAddress, setWalletAddress] = useState('');
    const [ethersProvider, setEthersProvider] = useState(
        // A Web3Provider wraps a standard Web3 provider, which is
        // what Metamask injects as window.ethereum into each page
        new ethers.providers.Web3Provider(window.ethereum)
    );
    const [ethersSigner, setEtherSigner] = useState(
        // The Metamask plugin also allows signing transactions to
        // send ether and pay to change state within the blockchain.
        // For this, you need the account signer...
        ethersProvider.getSigner()
    );


    useEffect(() => {
        async function loadL2Wallet() {
            const l2Provider = await Manager.Instance.getProviderByLayer2Type(
                Layer2Type.ZK_SYNC,
                NETWORK
            );
            setL2Provider(l2Provider);

            try {
                const walletBuilder = await l2Provider.getLayer2WalletBuilder();
                const l2Wallet = await walletBuilder.fromOptions({
                    ethersSigner
                });

                if (l2Wallet) {
                    setL2Wallet(l2Wallet);
                    setWalletAddress(await l2Wallet.getAddress());
                } else {
                    console.error('Layer 2 wallet has not been loaded');
                }
            } catch (err) {
                console.log(err);
            }
        }
        loadL2Wallet();
    }, []); // Note empty array here as a second argument.

    function handleTransfer(event: React.FormEvent<HTMLInputElement>) {
        const { name, value } = event.currentTarget;
        console.log(`name: ${name}, value: ${value}`);
        setTransferData(prevData => ({ ...prevData, [name]: value }));
    }

    async function onSubmitTransfer(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const toAddress = transferData.addr;
        const amount = transferData.amount;

        // Use the network's suggested fee.
        const fee = await l2Provider!.getTransferFee(toAddress, WORKING_TOKEN);

        // Only show the fee if "onlyCheckFee" is selected.
        if (transferData.onlyCheckFee) {
            setConfirmed(`The suggested fee is: \n\n${fee}`);
            return;
        }

        const transfer = new Transfer({
            toAddress,
            amount, // Desired amount to transfer.
            fee,
            tokenSymbol: WORKING_TOKEN
        });

        // Do transfer. Will obtain Result object.
        const result = await l2Wallet!.transfer(transfer);

        // Obtain tx receipt
        const receipt = await result.getReceipt();

        setConfirmed(JSON.stringify(receipt, null, 2));

        // Refresh balance.
        await refreshBalance();
    }

    async function refreshBalance() {
        const balance = await l2Wallet!.getTokenBalance(WORKING_TOKEN);
        setBalance(ethers.utils.formatUnits(balance, 18));
    }

    function handleDeposit(event: React.FormEvent<HTMLInputElement>) {
        const { name, value } = event.currentTarget;
        console.log(`name: ${name}, value: ${value}`);
        setDepositData(prevData => ({ ...prevData, [name]: value }));
    }

    async function onSubmitDeposit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        // Get current wallet's address.
        const toAddress = await l2Wallet!.getAddress();
        const amount = depositData.amount;
        const fee = '0.01';

        const deposit = Deposit.createDeposit({ toAddress, amount, fee });

        // Perform DEPOSIT operation.
        alert('before deposit');
        const result = await l2Wallet!.deposit(deposit);
        alert('after deposit');

        // Get receipt.
        const receipt = await result.getReceipt();

        setDepositResult(JSON.stringify(receipt, null, 2));

        // Refresh balance.
        await refreshBalance();
    }

    return (
        <>
            <div>demo de layer 2</div>
            <button onClick={refreshBalance}>Show Balance</button>
            <br />
            <div>BALANCE</div>
            <div>
                <label>Address</label>
                <input readOnly={true} value={walletAddress} />
            </div>
            <div>
                <label>Amount</label>
                <input readOnly={true} value={balance} />
            </div>
            <br />
            <br />
            <br />
            <div>Transfer</div>
            <form onSubmit={onSubmitTransfer}>
                <label htmlFor="addr">Destination Address</label>
                <input
                    name="addr"
                    id="addr"
                    value={transferData.addr}
                    onChange={handleTransfer}
                />
                <br />
                <label htmlFor="amount">Amount</label>
                <input
                    name="amount"
                    id="amount"
                    value={transferData.amount}
                    onChange={handleTransfer}
                />
                <br />
                <label htmlFor="onlyCheckFee">Only check fee</label>
                <input
                    name="onlyCheckFee"
                    id="onlyCheckFee"
                    type="checkbox"
                    checked={transferData.onlyCheckFee}
                    onChange={() =>
                        setTransferData(prevData => ({
                            ...prevData,
                            onlyCheckFee: !transferData.onlyCheckFee
                        }))
                    }
                />
                <br />
                <button type="submit">
                    {transferData.onlyCheckFee ? 'Check Fee' : 'Apply Transfer'}
                </button>
                <br />
                Result:
                <br />
                <textarea
                    readOnly={true}
                    value={confirmed}
                    rows={10}
                    cols={50}
                />
            </form>
            <br />
            <br />
            <br />
            <div>Deposit</div>
            <form onSubmit={onSubmitDeposit}>
                <label htmlFor="amountDeposit">Amount</label>
                <input
                    name="amount"
                    id="amountDeposit"
                    value={depositData.amount}
                    onChange={handleDeposit}
                />
                <br />
                <button type="submit">Apply Deposit</button>
                <br />
                Result:
                <br />
                <textarea
                    readOnly={true}
                    value={depositResult}
                    rows={10}
                    cols={50}
                />
            </form>
        </>
    );
};
