package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Messenger CC initialized")

	return shim.Success(nil)
}

func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Messenger CC invoked")
	function, args := stub.GetFunctionAndParameters()
	if function == "sendMessage" {
		return t.sendMessage(stub, args)
	} else if function == "getMess" {
		// the old "Query" is now implemtned in invoke
		return t.getMessages(stub, args)
	} else if function == "addNewUser" {
		return t.addNewUser(stub, args)
	} else if function == "users" {
		return t.getUsers(stub, args)
	}

	return shim.Error("Invalid invoke function name: " + function + "! Expecting \"invoke\" \"getMess\" \"addNewUser\" \"users\"")
}

type UserDesc struct {
	Username string
	Fullname string
}

func (t *SimpleChaincode) getUsers(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	var users []UserDesc

	if len(args) != 0 {
		return shim.Error("Incorrect number of arguments. Expecting 0")
	}

	userListB, err := stub.GetState("users")
	if err != nil {
		return shim.Error("Failed to get state")
	}
	// Check whether this is not the first user
	if userListB == nil {
		resp, err := json.Marshal(users)
		if err != nil {
			shim.Error("Failed to JSON")
		}
		return shim.Success([]byte(resp))
	}
	return shim.Success(userListB)

}

// Function that adds a new userId
// args: [newUserId]
func (t *SimpleChaincode) addNewUser(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	var users []UserDesc
	var user UserDesc

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	user.Username = args[0]
	user.Fullname = args[1]

	// Getting user list
	userListB, err := stub.GetState("users")
	if err != nil {
		return shim.Error("Failed to get state")
	}
	// Check whether this is not the first user
	if userListB != nil {
		if err = json.Unmarshal(userListB, &users); err != nil {
			return shim.Error("Failed to decode previous users")
		}
	}

	users = append(users, user)

	usersB, err := json.Marshal(users)
	if err != nil {
		return shim.Error("Failed to create new user")
	}
	err = stub.PutState("users", []byte(usersB))
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(nil)
}

func makeTimestamp() string {
	return strconv.FormatInt(time.Now().UnixNano()/int64(time.Millisecond), 10)
}

// Function that sends a message between two users
// args: [fromUserId, toUserId, messageContent]
func (t *SimpleChaincode) sendMessage(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	from := args[0]
	to := args[1]
	content := args[2]
	date := makeTimestamp()

	// Create composit index
	indexName := "from~to~date"
	fromToIndexKey, err := stub.CreateCompositeKey(indexName, []string{from, to, date})
	if err != nil {
		return shim.Error(err.Error())
	}
	indexName = "to~from~date"
	toFromIndexKey, err := stub.CreateCompositeKey(indexName, []string{to, from, date})
	if err != nil {
		return shim.Error(err.Error())
	}

	// Saving message
	err = stub.PutState(fromToIndexKey, []byte(content))
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(toFromIndexKey, []byte(content))
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

func (t *SimpleChaincode) createInboxString(stub shim.ChaincodeStubInterface, name string, compStruct string, buffer *bytes.Buffer, iterator shim.StateQueryIteratorInterface) error {
	buffer.WriteString("\"")
	buffer.WriteString(name)
	buffer.WriteString("\":")
	buffer.WriteString("[")
	bArrayMemberAlreadyWritten := false

	var i int
	for i = 0; iterator.HasNext(); i++ {
		responseRange, err := iterator.Next()
		if err != nil {
			return err
		}

		_, compositeKeyParts, err := stub.SplitCompositeKey(responseRange.Key)
		if err != nil {
			return err
		}
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		returnedFirst := compositeKeyParts[0]
		returnedSecond := compositeKeyParts[1]
		returnedThird := compositeKeyParts[2]

		fullCompositeKey, err := stub.CreateCompositeKey(compStruct, []string{returnedFirst, returnedSecond, returnedThird})
		bArrayMemberAlreadyWritten = true
		if err != nil {
			return err
		}
		devMessBytes, err := stub.GetState(fullCompositeKey)
		if err != nil {
			return err
		}
		if devMessBytes == nil {
			return err
		}
		messageContent := string(devMessBytes)

		var returnedFrom, returnedTo string
		if name == "Inbox" {
			returnedFrom = compositeKeyParts[1]
			returnedTo = compositeKeyParts[0]
		} else {
			returnedFrom = compositeKeyParts[0]
			returnedTo = compositeKeyParts[1]
		}
		returnedDateInt, err := strconv.ParseInt(returnedThird[:len(returnedThird)-3], 10, 64)
		if err != nil {
			return err
		}
		returnedDateTime := time.Unix(returnedDateInt, 0)

		buffer.WriteString("{\"From\":\"")
		buffer.WriteString(returnedFrom)
		buffer.WriteString("\",\"To\":\"")
		buffer.WriteString(returnedTo)
		buffer.WriteString("\",\"Date\":\"")
		buffer.WriteString(returnedDateTime.String())
		buffer.WriteString("\",\"Content\":\"")
		buffer.WriteString(messageContent)
		buffer.WriteString("\"}")
	}
	buffer.WriteString("]")
	return nil
}

// Function that returns all of a users messages from the chaincode
// args: [userId]
func (t *SimpleChaincode) getMessages(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var userID string // ID of the sender
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting a single user id.")
	}

	userID = args[0]

	fromToResultsIterator, err := stub.GetStateByPartialCompositeKey("from~to~date", []string{userID})
	if err != nil {
		return shim.Error(err.Error())
	}
	defer fromToResultsIterator.Close()

	var buffer bytes.Buffer
	buffer.WriteString("{")
	err = t.createInboxString(stub, "Outbox", "from~to~date", &buffer, fromToResultsIterator)
	if err != nil {
		return shim.Error(err.Error())
	}
	buffer.WriteString(",")
	toFromResultsIterator, err := stub.GetStateByPartialCompositeKey("to~from~date", []string{userID})
	err = t.createInboxString(stub, "Inbox", "to~from~date", &buffer, toFromResultsIterator)
	if err != nil {
		return shim.Error(err.Error())
	}
	buffer.WriteString("}")

	return shim.Success(buffer.Bytes())
}

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
