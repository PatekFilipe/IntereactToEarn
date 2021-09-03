import Web3 from 'web3';
import * as InteractToEarnJSON from '../../../build/contracts/InteractToEarn.json';
import { InteractToEarn } from '../../types/InteractToEarn';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class InteractToEarnWrapper {
    web3: Web3;

    contract: InteractToEarn;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(InteractToEarnJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async farmBalance(fromAddress: string) {
        const tx = await this.contract.methods.farmBalance().send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress  
        });

        return tx;
    }

    async getBalance(fromAddress: string) {
        const data = await this.contract.methods.currentBalance().call({ from: fromAddress });

        return parseInt(data, 10);
    }

    async Deposit(value: number, fromAddress: string) {
        const tx = await this.contract.methods.Deposit(value).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress,
            value  
        });

        return tx;
    }

    async withdrawMoney(value: number, fromAddress: string) {
        const tx = await this.contract.methods.withdrawBalance(value).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress, 
            value  
        });

        return tx;
    }

    async deploy(fromAddress: string) {
        const tx = this.contract
            .deploy({
                data: InteractToEarnJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress
            });

        let transactionHash: string = null;
        tx.on('transactionHash', (hash: string) => {
            transactionHash = hash;
        });

        const contract = await tx;

        this.useDeployed(contract.options.address);

        return transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
