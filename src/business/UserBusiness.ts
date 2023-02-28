import { UserDatabase } from "../database/UserDatabase"
import { DeleteUserInputDTO, GetAllOutputDTO, GetUserByIdInputDTO, LoginInputDTO, LoginOutputDTO, SignupInputDTO, SignupOutputDTO } from "../dtos/userDTO";
import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { User } from "../models/User";
import { HashManager } from "../services/HashManager";
import { IdGenerator } from "../services/IdGenerator";
import { TokenManager } from "../services/TokenManager";
import { TokenPayload, UserDB, UserModel, USER_ROLES } from "../types";

export class UserBusiness {
    constructor(
        private userDatabase: UserDatabase,
        private idGenerator: IdGenerator,
        private tokenManager: TokenManager,
        private hashManager: HashManager
    ) { }

    public signup = async (input: SignupInputDTO): Promise<SignupOutputDTO> => {
        const { name, email, password } = input

        if (typeof name !== "string") {
            throw new BadRequestError("'name' deve ser string")
        }

        if (typeof email !== "string") {
            throw new BadRequestError("'email' deve ser string")
        }

        if (typeof password !== "string") {
            throw new BadRequestError("'password' deve ser string")
        }

        const emailAlreadyExists = await this.userDatabase.findByEmail(email)

        if (emailAlreadyExists) {
            throw new BadRequestError("'email' já existe")
        }

        const id = this.idGenerator.generate()
        const hashedPassword = await this.hashManager.hash(password)
        const role = USER_ROLES.NORMAL
        const createdAt = new Date().toISOString()

        const newUser = new User(
            id,
            name,
            email,
            hashedPassword,
            role,
            createdAt
        )

        const userDB = newUser.toDBModel()

        await this.userDatabase.insert(userDB)

        const payload: TokenPayload = {
            id: newUser.getId(),
            name: newUser.getName(),
            role: newUser.getRole()
        }

        const token = this.tokenManager.createToken(payload)

        const output: SignupOutputDTO = {
            token
        }

        return output
    }

    public login = async (input: LoginInputDTO): Promise<LoginOutputDTO> => {
        const { email, password } = input

        if (typeof email !== "string") {
            throw new BadRequestError("'email' deve ser string")
        }

        if (typeof password !== "string") {
            throw new BadRequestError("'password' deve ser string")
        }

        const userDB: UserDB | undefined = await this.userDatabase.findByEmail(email)

        if (!userDB) {
            throw new NotFoundError("'email' não cadastrado")
        }

        const user = new User(
            userDB.id,
            userDB.name,
            userDB.email,
            userDB.password,
            userDB.role,
            userDB.created_at
        )

        const hashedPassword = user.getPassword()

        const isPasswordCorrect = await this.hashManager
            .compare(password, hashedPassword)

        if (!isPasswordCorrect) {
            throw new BadRequestError("'password' incorreto")
        }

        const payload: TokenPayload = {
            id: user.getId(),
            name: user.getName(),
            role: user.getRole()
        }

        const token = this.tokenManager.createToken(payload)

        const output: LoginOutputDTO = {
            token
        }

        return output
    }

    public getAll = async (): Promise<GetAllOutputDTO> => {
        const usersDB = await this.userDatabase.getAll()

        const output = usersDB.map((userDB) => {
            const user = new User(
                userDB.id,
                userDB.name,
                userDB.email,
                userDB.password,
                userDB.role,
                userDB.created_at
            )

            return user.toBusinessModel()
        })

        return output
    }

    public delete = async (input: DeleteUserInputDTO) => {
        const { idToDelete, token } = input

        if (token === undefined) {
            throw new BadRequestError("token é necessário");
        }

        const payload = this.tokenManager.getPayload(token)

        if (payload === null) {
            throw new BadRequestError("Usuário não está logado")
        }

        const userDBExists = await this.userDatabase.findById(idToDelete)

        if (!userDBExists) {
            throw new NotFoundError("'id' não encontrado")
        }

        await this.userDatabase.deleteUser(idToDelete)

        const outPut = {
            message: "usuário deletado",
        }

        return outPut
    }

    public getUserById = async (input: GetUserByIdInputDTO): Promise<UserModel> => {
        const { idToSearch, token } = input

        if (token === undefined) {
            throw new BadRequestError("token é necessário");
        }

        const payload = this.tokenManager.getPayload(token)

        if (payload === null) {
            throw new BadRequestError("Usuário não está logado")
        }

        const userDBExists = await this.userDatabase.findById(idToSearch)

        if (!userDBExists) {
            throw new NotFoundError("'id' não encontrado")
        }

        const user = new User(
            userDBExists.id,
            userDBExists.name,
            userDBExists.email,
            userDBExists.password,
            userDBExists.role,
            userDBExists.created_at
        ).toBusinessModel()

        return user
    }
}