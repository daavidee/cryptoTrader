<h1>Note: This project is a work in progress.</h1>
<h2>About</h2>
The aim of this project is to have a trading platform for cryptocurrencies which has support for many of the popular exchanges and is (almost) fully automatic. Both simple and advanced trading strategies are used. 
<p><a href="http://nodejs.org/">Node.js</a> is used for the backend including serving the content to the frontend via HTTP. All data such as market volume and price history are stored in a <a href="http://www.postgresql.org/">PostgreSQL</a> database. The frontend will provide statistical information and the ability to modify the trade parameters. All services are hosted locally on the same machine.

<h2>What are Cryptocurrencies?</h2>
Cryptocurrencies are digital currencies which use cryptography for the creation and secure exchange of coins. They have no intrinsic value and the price is determined purely from market forces (speculation, value of the network and protocol, etc.). As a result, they are extremely volatile. <a href="https://bitcoin.org">Bitcoin</a> is the most popular cryptocurrency as of this writing and is currently valued at $600 USD per coin.

<h2 id="What_is_node"><div class="anchor">What is Node?</div></h2>
Node is a platform built on Chrome's JavaScript engine which brings JavaScript to the server side. It uses an event-driven, asynchronous model which is perfect for network and I/O intensive applications.

<h2>Features</h2>
Note: Not all features are fully implemented.
<ul>
<li>Integration with <a href="https://www.cryptsy.com/">cryptsy</a>, <a href="https://bter.com/">bter</a>, <a href="https://vircurex.com/">vircurex</a>, <a href="https://btc-e.com/">btc-e</a> and <a href="https://www.kraken.com/">kraken</a></li>
<li>Historical market and volume data from all exchanges gathered every minute</li>
<li>Frontend for control and display of raw and analysed statistical data</li>
<li>Simple arbitrage and advanced trading strategies</li>
<li>Integration with coin wallets</li>
<li>Use of public proxies to gather public data in realtime</li>
</ul>

<h2>Requirements</h2>
<ul>
<li><a href="http://www.postgresql.org/">PostgreSQL</a></li>
<li><a href="http://nodejs.org/">Node.js</a></li>
<li>The following node packages: <a href="https://www.npmjs.org/package/nonce">nonce</a>, <a href="https://www.npmjs.org/package/pg">pg</a>, <a href="https://www.npmjs.org/package/request">request</a> </li>
<li>The 'keys' file will need to be populated with API keys and database credentials</li>
</ul>

<h2>Notes</h2>
Currently, the bot is able to gather data from cryptsy, vircurex and bter and perform trading of Dogecoin based on simple rules. The frontend can display the sum total of balances on all exchanges, past 24hr trading prices and volume with basic statistics and will play a looping notification sound when a trade is taking place for debugging purposes.
