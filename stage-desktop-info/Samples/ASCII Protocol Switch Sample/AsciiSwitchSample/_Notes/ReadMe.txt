
The ASCII 2.x readers support a single and double press trigger action and are very customisable (refer to the user guide for more information)
- Each action can be defined as off, read, write, inventory, barcode or user
- When the switch action is set to user the trigger action executes a configured ASCII command
- The trigger can be set to report when it's state changes
- There is a command to perform a single or double trigger press (replicating the user pulling the trigger)

This allows an application to change the default behaviour of the triggers or to turn off any trigger action and to respond
to notification in change of trigger state and command the reader independently

This code sample demonstrates customising and use the switch action
- programming the action of the single and/or double press
- programming the custom user action for each press type
- receiving trigger change notifications

Structure of application
========================
The application is moving towards a databound view model. Application function is split into ViewModels where the interesting code
resides. Actions are defined as ICommands that are bound to controls in the form. As the control is clicked on the form the Execute
method of the ICommand is called. The control is enabled and disabled appropriately depending whether the action can be executed or
not. This is handled by the ReaderCommand class. 
Within each ViewModel the actions are defined as ICommands. The instances of ICommands accept a delegate the actually perform the action
of the ICommand. Refer to the ExecuteXXX methods for what is performed for each command

- The ReaderService handles setting up the connection to the reader.
- The CommandsViewModel provides ICommands to action the switch and other general commands
- The ConnectViewModel handles using the reader service to connect and disconnect from the reader
- The DisplayResponder is a custom responder to capture all responses from the reader to optionally show on the UI
- The MainViewModel sets up the responder chain that receives all the responses from the reader and update the user interface
- The SwitchActionViewModel provides ICommands to configure the switch actions

Version 1.1
-----------
- Derived from the Inventory sample

Version 1.2
-----------
- update to API v1.0
- switch to alternate display responder
