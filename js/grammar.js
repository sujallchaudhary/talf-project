class Grammar {
    constructor() {
        this.rules = {};
        this.startSymbol = null;
        this.nonTerminals = new Set();
        this.terminals = new Set();
    }

    static parse(input) {
        const grammar = new Grammar();
        const lines = input.trim().split('\n').filter(l => l.trim() !== '');

        if (lines.length === 0) {
            throw new Error('No grammar rules provided.');
        }

        for (const line of lines) {
            const match = line.match(/^\s*([A-Z])\s*(?:->|→)\s*(.*)$/);
            if (!match) {
                throw new Error(
                    `Invalid rule: "${line.trim()}"\nExpected format: A -> α₁ | α₂`
                );
            }

            const lhs = match[1];
            const rhsRaw = match[2];

            if (!grammar.startSymbol) grammar.startSymbol = lhs;
            grammar.nonTerminals.add(lhs);

            const alternatives = rhsRaw.split('|').map(alt => {
                const trimmed = alt.trim().replace(/\s+/g, '');
                if (trimmed === 'ε' || trimmed.toLowerCase() === 'epsilon' || trimmed === '') {
                    return '';
                }
                return trimmed;
            });

            if (grammar.rules[lhs]) {
                grammar.rules[lhs] = grammar.rules[lhs].concat(alternatives);
            } else {
                grammar.rules[lhs] = alternatives;
            }
        }

        for (const prods of Object.values(grammar.rules)) {
            for (const prod of prods) {
                for (const ch of prod) {
                    if (!grammar.nonTerminals.has(ch)) {
                        grammar.terminals.add(ch);
                    }
                }
            }
        }
        
        for (const prods of Object.values(grammar.rules)) {
            for (const prod of prods) {
                for (const ch of prod) {
                    if (/[A-Z]/.test(ch) && !grammar.rules[ch]) {
                        throw new Error(
                            `Non-terminal '${ch}' is used in a production but has no rule defined.`
                        );
                    }
                }
            }
        }

        return grammar;
    }

    isNonTerminal(ch) {
        return this.nonTerminals.has(ch);
    }
}
