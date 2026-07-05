# Giharad RPG - Fastplay (Foundry VTT)

Bem-vindo(a) ao sistema oficial (versão Fastplay) de **Giharad RPG** para o Foundry VTT!

Abaixo você encontra um guia rápido de como utilizar as automações da Ficha de Personagem.

---

## 1. Atributos e Rolagens
O sistema de Giharad não utiliza números fixos para Atributos, mas sim **Dados de Atributo** (ex: `d6`, `d8`).
- **Definindo Atributos:** Na aba "Geral" da ficha, você pode selecionar o dado base de cada um dos quatro Atributos Primários (Físico, Reflexos, Mente, Carisma).
- **Testes e Rolagens:** Para realizar um teste de atributo puro, basta clicar no ícone de dado com Shift + Click. Para rolar as competências, basta clickar no icone de dado ao lado da competência.
- **Expertises e Incapacidades:** O sistema calculará o grau de Treinamento e as Expertises/Incapacidades aplicadas caso você tenha bônus inseridos nos campos apropriados.

## 2. Automação: Estouro de Dado 
Se a rolagem base de um Teste ou Atributo cair no valor máximo daquele dado (ex: tirar 8 num d8), o sistema detecta o **Estouro de Dado** automaticamente!
- O Foundry rolará um dado extra do mesmo valor sozinho e adicionará ao resultado.
- **Nota:** Como manda a regra, *dados extras não estouram*, garantindo que não ocorra um loop infinito.
- Esta automação de estouro *não* se aplica em rolagens de dano (que usam a mecânica de Dano Explosivo descrita abaixo).

## 3. Armas e Dano Explosivo
No inventário, você pode criar armas e configurar o Dano e as margens de crítico.
- **Dano Explosivo:** Na configuração da arma, preencha o valor de Explosão (ex: `20/+1`).
- Se a sua rolagem total de ataque atingir ou superar a margem (ex: 20), o Dano se torna Explosivo.
- O sistema da ficha já calcula o passo do atributo Físico para o bônus final de dano das armas! Ao clicar no ícone de dado de Dano de uma arma corpo-a-corpo, a rolagem de dano base somará automaticamente o seu bônus de Passos Físicos.

## 4. Profissões e Idiomas Customizáveis
Na aba **Combate/Habilidades**, logo no final da lista de competências, existe uma área chamada **Extras**.
- Clique nos botões **"+ Profissão"** ou **"+ Idioma"** para adicionar competências customizadas.
- Uma nova linha será criada: você pode editar o nome (ex: "Ferreiro", "Giharadiano Antigo") digitando diretamente na caixa de texto.
- Você pode escolher o atributo-chave associado no menu *dropdown*.
- Para rolar, clique no ícone de dado igual a qualquer outra competência. Se não quiser mais a competência, clique no ícone de Lixeira.

## 5. Magia, Espaços e CD
A aba **Magia** controla os seus recursos de feitiços (para Conjuradores e Zelotes).
- **Espaços de Magia (Slots):** O sistema utiliza a progressão acelerada do *Fastplay*. O "Máximo" de usos diários (caixinha transparente) é calculado sozinho com base no Nível e Classe da sua ficha (Círculos 1 e 2). A primeira caixinha serve para você controlar os gastos.
- **Classe de Dificuldade (CD):** No cabeçalho da Magia, clique no botão **CD** (com o raiozinho). O sistema não usa números fixos: ele identificará qual o seu Atributo Mágico Chave, rolará o dado associado e mandará a Dificuldade direto para o chat para os inimigos resistirem!

## 6. Dinâmicas Automáticas da Ficha
Preencha o seu **Nível** e **Classe** para que a ficha trabalhe por você. O sistema calcula sozinho:
- **Pontos de Vida (PV) e Ação (PA) Máximos:** Calculados pela fórmula de progressão de nível da classe e seu atributo Físico.
- **Pontos de Grima (PG) e Hafa (PH):** Limite máximo sempre igual ao dobro do Nível.
- **Carga:** Peso atual versus Peso Máximo, calculado de acordo com os "espaços" inseridos em cada item do seu Inventário.

---

> *Lembre-se: Giharad é letal. Cada recurso conta, então gerencie seus Pontos de Ação e proteja-se da Grima. Boa aventura!*
