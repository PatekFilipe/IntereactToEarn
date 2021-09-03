pragma solidity >=0.8.0;

contract InteractToEarn {
	int public balanceReceived;
	uint blockstarttime;

	function Deposit(int depositValue) payable public {
		uint blockstarttime = block.number;
		balanceReceived = balanceReceived + depositValue;
	}

	function farmBalance() public payable {
		int interest = balanceReceived / 100 * 30;
		balanceReceived = balanceReceived + interest;
	}

	function withdrawBalance(int withdrawValue) payable public {
		require(withdrawValue <=balanceReceived, "Withdraw less than what was received in the contract.");
		balanceReceived = balanceReceived - withdrawValue;
	}

	function getDepositBlock() public view returns (uint) {
		return blockstarttime;
	}

	function currentBalance() public view returns (int) {
		return balanceReceived;
	}
}