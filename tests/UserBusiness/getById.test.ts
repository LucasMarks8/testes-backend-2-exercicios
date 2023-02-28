import { UserBusiness } from "../../src/business/UserBusiness"
import { GetUserByIdInputDTO } from "../../src/dtos/userDTO"
import { USER_ROLES } from "../../src/types"
import { HashManagerMock } from "../mocks/HashManagerMock"
import { IdGeneratorMock } from "../mocks/IdGeneratorMock"
import { TokenManagerMock } from "../mocks/TokenManagerMock"
import { UserDatabaseMock } from "../mocks/UserDatabaseMock"

describe("getById", () => {
    const userBusiness = new UserBusiness(
        new UserDatabaseMock(),
        new IdGeneratorMock(),
        new TokenManagerMock(),
        new HashManagerMock()
    )

    test("deve retornar um usuário buscado pelo id", async () => {
        const input: GetUserByIdInputDTO = {
            idToSearch: "id-mock",
            token: "token-mock-normal"
        }
        
        const response = {
            id: "id-mock",
            name: "Normal Mock",
            email: "normal@email.com",
            password: "hash-bananinha",
            createdAt: expect.any(String), // valor dinâmico (pode ser qualquer string)
            role: USER_ROLES.NORMAL
        }
        const user = await userBusiness.getUserById(input)
     
        expect(user).toEqual(response)
    })
})