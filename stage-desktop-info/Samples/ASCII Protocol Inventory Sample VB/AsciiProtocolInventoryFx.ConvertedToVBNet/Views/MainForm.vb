Imports TechnologySolutions.Rfid.AsciiProtocol
Imports System.Collections.Generic
Imports System.ComponentModel
Imports System.Data
Imports System.Drawing
Imports System.Linq
Imports System.Text
Imports System.Windows.Forms
Namespace Views

	Public Partial Class MainForm
		Inherits Form
		''' <summary>
		''' Handles conencting to the reader
		''' </summary>
		Private connectViewModel As ConnectViewModel

		''' <summary>
		''' Handles commanding the reader
		''' </summary>
		Private viewModel As MainViewModel

		''' <summary>
		''' Initializes a new instance of the MainForm class
		''' </summary>
		Public Sub New()
			Me.InitializeComponent()

			Me.viewModel = New MainViewModel()
			AddHandler Me.viewModel.CommandCompleted, AddressOf Me.ViewModel_CommandCompleted
			AddHandler Me.viewModel.TransponderMessageHandler, AddressOf Me.ViewModel_TransponderMessage
			AddHandler Me.viewModel.BarcodeMessageHandler, AddressOf Me.ViewModel_BarcodeMessage
			AddHandler Me.viewModel.ResponseLine, AddressOf Me.ViewModel_ResponseLine
			' TODO: this.viewModel.PropertyChanged 

			Me.connectViewModel = New ConnectViewModel()
			Me.connectViewModel.PortName = Service.Settings.PortName
			AddHandler Me.connectViewModel.PropertyChanged, AddressOf Me.ConnectViewModel_PropertyChanged

			' Create a menu of session values
			Me.querySessionComboBox.DataSource = [Enum].GetValues(GetType(QuerySession))
			' Use the description when displaying to the user
            Me.querySessionComboBox.FormattingEnabled = True
            AddHandler Me.querySessionComboBox.Format, AddressOf Me.ComboBox_EnumFormat

            Me.queryTargetComboBox.DataSource = [Enum].GetValues(GetType(QueryTarget))
            Me.queryTargetComboBox.FormattingEnabled = True
            AddHandler Me.queryTargetComboBox.Format, AddressOf Me.ComboBox_EnumFormat

            AddHandler Me.Load, AddressOf Me.Form_Load
        End Sub

        ''' <summary>
        ''' Gets or sets the list of available com ports
        ''' </summary>
        Public Property PortNames() As IEnumerable(Of String)
            Get
                Dim result As List(Of String)

                result = New List(Of String)
                For Each item As ToolStripDropDownItem In Me.portToolStripMenuItem.DropDownItems
                    result.Add(item.Name)
                Next

                Return result
            End Get

            Set(ByVal value As IEnumerable(Of String))
                Dim selectedPortName As String

                selectedPortName = Me.connectViewModel.PortName
                Me.portToolStripMenuItem.DropDownItems.Clear()
                For Each portName As String In value
                    Dim menuItem As ToolStripMenuItem

                    menuItem = New ToolStripMenuItem() With { _
                      .Text = portName, _
                      .Checked = selectedPortName.Equals(portName) _
                    }

                    AddHandler menuItem.Click, AddressOf PortMenuItem_Click

                    Me.portToolStripMenuItem.DropDownItems.Add(menuItem)
                Next
            End Set
        End Property

        Private Sub PortMenuItem_Click(ByVal sender As Object, ByVal e As EventArgs)
            For Each item As ToolStripMenuItem In Me.portToolStripMenuItem.DropDownItems
                item.Checked = False
            Next

            Me.connectViewModel.PortName = TryCast(sender, ToolStripMenuItem).Text
            TryCast(sender, ToolStripMenuItem).Checked = True
        End Sub

        ' returns the description of the Enum to display in the combobox
        Private Sub ComboBox_EnumFormat(ByVal sender As Object, ByVal e As ListControlConvertEventArgs)
            If e.Value Is GetType(QuerySession) Then
                e.Value = CType(e.Value, QuerySession).Description()
            ElseIf e.Value Is GetType(QueryTarget) Then
                e.Value = CType(e.Value, QueryTarget).Description()
            End If
        End Sub

        Private Sub Form_Load(ByVal sender As Object, ByVal e As EventArgs)
            Me.PortNames = Me.connectViewModel.PortNames

            ' Configure minimum sizes here to work round a UI designer bug
            Me.resultsSplitContainer.Panel1MinSize = 400
            Me.resultsSplitContainer.Panel2MinSize = 300
            Me.mainSplitContainer.Panel1MinSize = 120
            Me.mainSplitContainer.Panel2MinSize = 240


            Me.mainSplitContainer.Panel1Collapsed = Not Service.Settings.isProtocolResponsePanelVisible
            Me.showProtocolResponsesToolStripMenuItem.Checked = Service.Settings.isProtocolResponsePanelVisible

            Me.ConnectViewModel_PropertyChanged(sender, New PropertyChangedEventArgs("IsConnected"))
        End Sub

        Private Sub ExitToolStripMenuItem_Click(ByVal sender As Object, ByVal e As EventArgs)
            Me.Close()
        End Sub

        Private Sub ConnectToolStripMenuItem_Click(ByVal sender As Object, ByVal e As EventArgs)
            Me.connectViewModel.Connect()
        End Sub

        Private Sub DisconnectToolStripMenuItem_Click(ByVal sender As Object, ByVal e As EventArgs)
            Me.connectViewModel.Disconnect()
        End Sub

        Private Sub RefreshPortsToolStripMenuItem_Click(ByVal sender As Object, ByVal e As EventArgs)
            Me.connectViewModel.RefreshPorts()
            Me.PortNames = Me.connectViewModel.PortNames
        End Sub

        Private Sub ScanRfidCommandButton_Click(ByVal sender As Object, ByVal e As EventArgs)
            System.Threading.ThreadPool.QueueUserWorkItem(AddressOf Me.ExecuteInventoryAsync)
        End Sub

        Private Sub scanRfidAsyncButton_Click(ByVal sender As Object, ByVal e As EventArgs)
            Me.viewModel.ExecuteInventoryCommand(False)
        End Sub

        ' This will be called on the thread pool thread. 
        ' As executing synchronously the command will block until the response is received.
        ' Calling from a thread pool thread leaves the UI thread free to update as the response is received
        Private Sub ExecuteInventoryAsync(ByVal state As Object)
            Me.viewModel.ExecuteInventoryCommand(True)
        End Sub

        Private Sub ScanBarcodeCommandButton_Click(ByVal sender As Object, ByVal e As EventArgs)
            System.Threading.ThreadPool.QueueUserWorkItem(AddressOf Me.ExecuteBarcodeAsync)
        End Sub

        Private Sub ScanBarcodeAsyncButton_Click(ByVal sender As Object, ByVal e As EventArgs)
            Me.viewModel.ExecuteBarcodeCommand(False)
        End Sub

        ' This will be called on the thread pool thread. 
        ' As executing synchronously the command will block until the response is received.
        ' Calling from a thread pool thread leaves the UI thread free to update as the response is received
        Private Sub ExecuteBarcodeAsync(ByVal state As Object)
            Me.viewModel.ExecuteBarcodeCommand(True)
        End Sub

        Private Sub ViewModel_CommandCompleted(ByVal sender As Object, ByVal e As EventArgs)
            If Me.InvokeRequired Then
                Me.Invoke(New EventHandler(AddressOf Me.ViewModel_CommandCompleted), New Object() {sender, e})
            Else
            End If
        End Sub

        Private Sub ViewModel_TransponderMessage(ByVal sender As Object, ByVal e As TextEventArgs)
            If Me.InvokeRequired Then
                Me.Invoke(New EventHandler(Of TextEventArgs)(AddressOf Me.ViewModel_TransponderMessage), New Object() {sender, e})
            Else
                Me.DisplayText(Me.transponderListBox, e.Text)
            End If
        End Sub

        Private Sub ViewModel_BarcodeMessage(ByVal sender As Object, ByVal e As TextEventArgs)
            If Me.InvokeRequired Then
                Me.Invoke(New EventHandler(Of TextEventArgs)(AddressOf Me.ViewModel_BarcodeMessage), New Object() {sender, e})
            Else
                Me.DisplayText(Me.barcodeListBox, e.Text)
            End If
        End Sub

        Private Sub ViewModel_ResponseLine(ByVal sender As Object, ByVal e As TextEventArgs)
            If Me.InvokeRequired Then
                Me.Invoke(New EventHandler(Of TextEventArgs)(AddressOf Me.ViewModel_ResponseLine), New Object() {sender, e})
            Else
                Me.DisplayText(Me.responsesListBox, e.Text)
            End If
        End Sub

        Private Sub ConnectViewModel_PropertyChanged(ByVal sender As Object, ByVal e As PropertyChangedEventArgs)
            If Me.InvokeRequired Then
                Me.Invoke(New PropertyChangedEventHandler(AddressOf Me.ConnectViewModel_PropertyChanged), New Object() {sender, e})
            Else
                Me.connectToolStripMenuItem.Enabled = Me.connectViewModel.CanConnect()
                Me.disconnectToolStripMenuItem.Enabled = Me.connectViewModel.CanDisconnect()
                Me.readerToolStripMenuItem.Enabled = Me.connectViewModel.CanRefreshPorts()
                Me.messageToolStripStatusLabel.Text = Me.connectViewModel.ConnectionStatus
            End If
        End Sub

        Private Sub DisplayText(ByVal listBox As ListBox, ByVal value As String)
            listBox.SuspendLayout()
            If listBox.Items.Count > 10000 Then
                For i As Integer = 0 To 49
                    listBox.Items.RemoveAt(0)
                Next
            End If

            listBox.Items.Add(value)
            listBox.SelectedIndex = listBox.Items.Count - 1
            listBox.ResumeLayout()
        End Sub


        Private Sub AboutToolStripMenuItem_Click(ByVal sender As Object, ByVal e As EventArgs)
            Using about As Form = New AboutBoxForm()
                about.ShowDialog()
            End Using
        End Sub

        Private Sub ClearTransponderResponsesButton_Click(ByVal sender As Object, ByVal e As EventArgs)
            Me.transponderListBox.Items.Clear()
        End Sub

        Private Sub ClearBarcodeResponsesButton_Click(ByVal sender As Object, ByVal e As EventArgs)
            Me.barcodeListBox.Items.Clear()
        End Sub

        Private Sub ClearProtocolResponsesToolStripMenuItem_Click(ByVal sender As Object, ByVal e As EventArgs)
            Me.responsesListBox.Items.Clear()
        End Sub

        Private Sub ClearTransponderResponsesToolStripMenuItem_Click(ByVal sender As Object, ByVal e As EventArgs)
            Me.transponderListBox.Items.Clear()
        End Sub

        Private Sub ClearBarcodeResponsesToolStripMenuItem_Click(ByVal sender As Object, ByVal e As EventArgs)
            Me.barcodeListBox.Items.Clear()
        End Sub

        Private Sub ClearAllResponsesToolStripMenuItem_Click(ByVal sender As Object, ByVal e As EventArgs)
            Me.responsesListBox.Items.Clear()
            Me.transponderListBox.Items.Clear()
            Me.barcodeListBox.Items.Clear()
        End Sub

        Private Sub ShowProtocolResponsesToolStripMenuItem_Click(ByVal sender As Object, ByVal e As EventArgs)
            Dim newState As Boolean = Not Service.Settings.isProtocolResponsePanelVisible
            Me.mainSplitContainer.Panel1Collapsed = Not newState
            Me.showProtocolResponsesToolStripMenuItem.Checked = newState
            Service.Settings.isProtocolResponsePanelVisible = newState
        End Sub

        Private Sub MainForm_FormClosing(ByVal sender As Object, ByVal e As FormClosingEventArgs)
            Service.Settings.PortName = Me.connectViewModel.PortName
            Service.Settings.Save()
        End Sub

        Private Sub QuerySessionComboBox_SelectedIndexChanged(ByVal sender As Object, ByVal e As EventArgs)
            Me.viewModel.Session = CType(querySessionComboBox.SelectedItem, QuerySession)
        End Sub

        Private Sub QueryTargetComboBox_SelectedIndexChanged(ByVal sender As Object, ByVal e As EventArgs)
            Me.viewModel.Target = CType(queryTargetComboBox.SelectedItem, QueryTarget)
        End Sub
    End Class
End Namespace
