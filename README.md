# conceptAuction

Ethereum based concept Auction system

# Requirements

Requires following software to run correctly:
- Node Package Manager (NPM)
- Truffle development framework
- Geth or ganache-cli as Ethereum test client

You can install NPM on MacOS with Homebrew

    brew install node

# Installation (Requires NPM)

    npm install -g truffle
    npm install -g ganache-cli
    git clone https://github.com/birkandenizer/conceptAuction.git
    cd conceptAuction
    npm install
    
 # Running
 
 Run your test Ethereum node (geth or ganache-cli) in a new terminal window, I'm using ganache
 
 Make sure to set your port to 8545
 
    ganache-cli
   
 Run following commands if you are still under conceptAuction directory, otherwise cd into conceptAuction directory
    
    truffle compile
    truffle migrate
    npm run dev
    
 # Usage
 
 You can use either Ethereum browser like Mist or browser plugin like Metamask to access locally running app at `http://localhost:8081`
