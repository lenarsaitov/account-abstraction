### Smart contract-based wallet

В данном проекте разработан смарт контракт, [дублирующий](https://www.argent.xyz/blog/wtf-is-account-abstraction/) некоторую логику _EOA аккаунтов (Externally Owned Accounts)_:
- Получение токенов 
- Отправка токенов
- Подпись транзакций 

Дополнительно в контракте реализован функционал _восстановления (смены владельца)_ с использованием доверенных лиц.

Подразумеваются, что токены соответствуют интерфейсу [IERC20](https://docs.openzeppelin.com/contracts/2.x/api/token/erc20) стандарта [ERC20](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/).

Подробности концепции _account abstraction_ можно изучить в следующий источниках:

[Part I: WTF is Account Abstraction](https://www.argent.xyz/blog/wtf-is-account-abstraction/)

[Part II: WTF is Account Abstraction](https://archive.md/OESa5#selection-243.0-246.0)

[Why EOA Wallets are a Threat to the Future of Blockchain](https://www.argent.xyz/blog/self-custody-mass-adoption/)

### Структура проекта

Смарт контракт был реализованный на _Solidity_ последней (на данный момент) версии _0.8.17_.

Использовались верифицированные контракты _OpenZeppelin_:

- _access/AccessControl.sol_
- _access/Ownable.sol_
- _token/ERC20/ERC20.sol_

Комментарии к коду были добавлены в соответствии со стандартом [_NatSpec_](https://docs.soliditylang.org/en/develop/natspec-format.html).

Стиль оформления контракта был во многом осуществлен под влиянием следующих статей:

[Solidity Style Guide (Part I)](https://medium.com/@ivanlieskov/solidity-style-guide-part-i-d0fda6041ff9)

[Solidity Style Guide (Part II)](https://medium.com/@ivanlieskov/solidity-style-guide-part-ii-23ac3b10fdfb)

### Тестирование

В папке _test_ расположены тесты, покрывающие большое количество позитивных и негативных сценариев (порядка 50 тестов). При их разработке использовались инструменты _hardhat, waffle, ethers, mocha, solidity-coverage_.

Для эмуляции взаимодействия с токенами _IERC20_ был использован соответствующий [_Mock контракт_](https://ethereum-waffle.readthedocs.io/en/latest/mock-contract.html).

Таблица покрытия кода выглядит следующим образом: 

![](docs/table.png)