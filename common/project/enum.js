
const ResponseType = {
    ERROR: 0,
    SUCCESS_LIST: 1,
    SUCCESS_OBJ: 2,
    SUCCESS_EMPTY: 3,
    SESSION_EXPIRE: 4
}
const ActionsType = {
    ADD: 0,
    UPDATE: 1,
    DELETE: 2,

}

const ErrorType = {
    ALREADY_EXISTS: 0,
    NOT_FOUND: 1,
    USED_IN_ANOTHER: 2,
}


module.exports = {
    ResponseType: ResponseType,
    ActionsType: ActionsType,
    ErrorType: ErrorType
}