class TreeNode {
    constructor(symbol, isTerminal) {
        this.symbol = symbol;
        this.isTerminal = isTerminal;
        this.children = [];
    }
}

class Derivation {

    static parse(grammar, target, timeout = 5000) {
        const maxDepth = Math.max(target.length * 5, 40);
        const ctx = { start: Date.now(), timeout, timedOut: false };

        for (const result of Derivation._parseNT(
            grammar, grammar.startSymbol, target, 0, 0, maxDepth, ctx
        )) {
            if (result.pos === target.length) {
                return result.node;
            }
        }

        if (ctx.timedOut) {
            throw new Error(
                'Parsing timed out. The grammar may be too complex or left-recursive.\n' +
                'Tip: remove direct/indirect left recursion and try again.'
            );
        }

        return null;
    }

    static *_parseNT(grammar, nt, target, pos, depth, maxDepth, ctx) {
        if (depth > maxDepth) return;
        if (Date.now() - ctx.start > ctx.timeout) { ctx.timedOut = true; return; }

        const productions = grammar.rules[nt];
        if (!productions) return;

        for (const prod of productions) {
            if (ctx.timedOut) return;
            yield* Derivation._parseProd(grammar, prod, nt, target, pos, depth + 1, maxDepth, ctx);
        }
    }

    static *_parseProd(grammar, prod, nt, target, pos, depth, maxDepth, ctx) {
        if (prod === '') {
            const node = new TreeNode(nt, false);
            node.children.push(new TreeNode('ε', true));
            yield { node, pos };
            return;
        }
        yield* Derivation._parseSeq(grammar, prod, 0, nt, target, pos, depth, maxDepth, ctx, []);
    }

    static *_parseSeq(grammar, prod, idx, nt, target, pos, depth, maxDepth, ctx, childrenSoFar) {
        if (ctx.timedOut) return;

        if (idx === prod.length) {
            const node = new TreeNode(nt, false);
            node.children = childrenSoFar.slice();
            yield { node, pos };
            return;
        }

        const sym = prod[idx];

        if (grammar.isNonTerminal(sym)) {
            for (const res of Derivation._parseNT(grammar, sym, target, pos, depth, maxDepth, ctx)) {
                if (ctx.timedOut) return;
                childrenSoFar.push(res.node);
                yield* Derivation._parseSeq(grammar, prod, idx + 1, nt, target, res.pos, depth, maxDepth, ctx, childrenSoFar);
                childrenSoFar.pop();
            }
        } else {
            if (pos < target.length && target[pos] === sym) {
                childrenSoFar.push(new TreeNode(sym, true));
                yield* Derivation._parseSeq(grammar, prod, idx + 1, nt, target, pos + 1, depth, maxDepth, ctx, childrenSoFar);
                childrenSoFar.pop();
            }
        }
    }
 
    static extractLeftmost(root) {
        let frontier = [root];
        const steps = [{ form: root.symbol, production: null }];

        while (true) {
            const idx = frontier.findIndex(n => !n.isTerminal);
            if (idx === -1) break;

            const node = frontier[idx];
            const prodStr = node.children.map(c => c.symbol).join('') || 'ε';
            let replacement = node.children;
            if (replacement.length === 1 && replacement[0].symbol === 'ε') {
                replacement = [];
            }

            frontier = [
                ...frontier.slice(0, idx),
                ...replacement,
                ...frontier.slice(idx + 1)
            ];

            const form = frontier.length === 0
                ? 'ε'
                : frontier.map(n => n.symbol).join('');

            steps.push({ form, production: `${node.symbol} → ${prodStr}` });
        }

        return steps;
    }

    static extractRightmost(root) {
        let frontier = [root];
        const steps = [{ form: root.symbol, production: null }];

        while (true) {
            let idx = -1;
            for (let i = frontier.length - 1; i >= 0; i--) {
                if (!frontier[i].isTerminal) {
                    idx = i;
                    break;
                }
            }
            if (idx === -1) break;

            const node = frontier[idx];
            const prodStr = node.children.map(c => c.symbol).join('') || 'ε';

            let replacement = node.children;
            if (replacement.length === 1 && replacement[0].symbol === 'ε') {
                replacement = [];
            }

            frontier = [
                ...frontier.slice(0, idx),
                ...replacement,
                ...frontier.slice(idx + 1)
            ];

            const form = frontier.length === 0
                ? 'ε'
                : frontier.map(n => n.symbol).join('');

            steps.push({ form, production: `${node.symbol} → ${prodStr}` });
        }

        return steps;
    }
}
