const regs = {
    email: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/,
    password: /^(?![a-zA-Z]+$)(?![A-Z0-9]+$)(?![A-Z\W_]+$)(?![a-z0-9]+$)(?![a-z\W_]+$)(?![0-9\W_]+$)[a-zA-Z0-9\W_]{8,18}$/,
    number: /^([0]|[1-9][0-9]*)$/
}

const verify = function (rule, value, reg, callback) {
    if (value) {
        if (reg.test(value)) {
            callback()
        } else {
            callback(new Error(rule.message))
        }
    } else {
        callback()
    }
}

export default {
    email(rule, value, callback) {
        return verify(rule, value, regs.email, callback)
    },
    password(rule, value, callback) {
        return verify(rule, value, regs.password, callback)
    }, number: (rule, value, callback) => {
        return verify(rule, value, regs.number, callback)
    }
}