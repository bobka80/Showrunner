Namespace Views
	Partial Class MainForm
		''' <summary>
		''' Required designer variable.
		''' </summary>
		Private components As System.ComponentModel.IContainer = Nothing

		''' <summary>
		''' Clean up any resources being used.
		''' </summary>
		''' <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
		Protected Overrides Sub Dispose(disposing As Boolean)
			If disposing AndAlso (components IsNot Nothing) Then
				components.Dispose()
			End If
			MyBase.Dispose(disposing)
		End Sub

		#Region "Windows Form Designer generated code"

		''' <summary>
		''' Required method for Designer support - do not modify
		''' the contents of this method with the code editor.
		''' </summary>
		Private Sub InitializeComponent()
			Me.components = New System.ComponentModel.Container()
			Me.mainMenuStrip = New System.Windows.Forms.MenuStrip()
			Me.fileToolStripMenuItem = New System.Windows.Forms.ToolStripMenuItem()
			Me.exitToolStripMenuItem = New System.Windows.Forms.ToolStripMenuItem()
			Me.readerToolStripMenuItem = New System.Windows.Forms.ToolStripMenuItem()
			Me.refreshPortsToolStripMenuItem = New System.Windows.Forms.ToolStripMenuItem()
			Me.portToolStripMenuItem = New System.Windows.Forms.ToolStripMenuItem()
			Me.connectToolStripMenuItem = New System.Windows.Forms.ToolStripMenuItem()
			Me.disconnectToolStripMenuItem = New System.Windows.Forms.ToolStripMenuItem()
			Me.viewToolStripMenuItem = New System.Windows.Forms.ToolStripMenuItem()
			Me.clearAllResponsesToolStripMenuItem = New System.Windows.Forms.ToolStripMenuItem()
			Me.toolStripSeparator2 = New System.Windows.Forms.ToolStripSeparator()
			Me.clearProtocolResponsesToolStripMenuItem = New System.Windows.Forms.ToolStripMenuItem()
			Me.toolStripSeparator1 = New System.Windows.Forms.ToolStripSeparator()
			Me.showProtocolResponsesToolStripMenuItem = New System.Windows.Forms.ToolStripMenuItem()
			Me.helpToolStripMenuItem = New System.Windows.Forms.ToolStripMenuItem()
			Me.aboutToolStripMenuItem = New System.Windows.Forms.ToolStripMenuItem()
			Me.mainStatusStrip = New System.Windows.Forms.StatusStrip()
			Me.messageToolStripStatusLabel = New System.Windows.Forms.ToolStripStatusLabel()
			Me.scanRfidButton = New System.Windows.Forms.Button()
			Me.scanBarcodeButton = New System.Windows.Forms.Button()
			Me.transponderListBox = New System.Windows.Forms.ListBox()
			Me.responsesListBox = New System.Windows.Forms.ListBox()
			Me.helperToolTip = New System.Windows.Forms.ToolTip(Me.components)
			Me.scanRfidAsyncButton = New System.Windows.Forms.Button()
			Me.scanBarcodeAsyncButton = New System.Windows.Forms.Button()
			Me.mainSplitContainer = New System.Windows.Forms.SplitContainer()
			Me.resultsSplitContainer = New System.Windows.Forms.SplitContainer()
			Me.panel3 = New System.Windows.Forms.Panel()
			Me.label4 = New System.Windows.Forms.Label()
			Me.queryTargetComboBox = New System.Windows.Forms.ComboBox()
			Me.label3 = New System.Windows.Forms.Label()
			Me.querySessionComboBox = New System.Windows.Forms.ComboBox()
			Me.panel2 = New System.Windows.Forms.Panel()
			Me.clearTransponderResponsesButton = New System.Windows.Forms.Button()
			Me.label2 = New System.Windows.Forms.Label()
			Me.panel1 = New System.Windows.Forms.Panel()
			Me.clearBarcodeResponsesButton = New System.Windows.Forms.Button()
			Me.barcodeListBox = New System.Windows.Forms.ListBox()
			Me.label1 = New System.Windows.Forms.Label()
			Me.mainMenuStrip.SuspendLayout()
			Me.mainStatusStrip.SuspendLayout()
			Me.mainSplitContainer.Panel1.SuspendLayout()
			Me.mainSplitContainer.Panel2.SuspendLayout()
			Me.mainSplitContainer.SuspendLayout()
			Me.resultsSplitContainer.Panel1.SuspendLayout()
			Me.resultsSplitContainer.Panel2.SuspendLayout()
			Me.resultsSplitContainer.SuspendLayout()
			Me.panel3.SuspendLayout()
			Me.panel2.SuspendLayout()
			Me.panel1.SuspendLayout()
			Me.SuspendLayout()
			' 
			' mainMenuStrip
			' 
			Me.mainMenuStrip.Items.AddRange(New System.Windows.Forms.ToolStripItem() {Me.fileToolStripMenuItem, Me.readerToolStripMenuItem, Me.viewToolStripMenuItem, Me.helpToolStripMenuItem})
			Me.mainMenuStrip.Location = New System.Drawing.Point(0, 0)
			Me.mainMenuStrip.Name = "mainMenuStrip"
			Me.mainMenuStrip.Size = New System.Drawing.Size(839, 24)
			Me.mainMenuStrip.TabIndex = 0
			Me.mainMenuStrip.Text = "menuStrip1"
			' 
			' fileToolStripMenuItem
			' 
			Me.fileToolStripMenuItem.DropDownItems.AddRange(New System.Windows.Forms.ToolStripItem() {Me.exitToolStripMenuItem})
			Me.fileToolStripMenuItem.Name = "fileToolStripMenuItem"
			Me.fileToolStripMenuItem.Size = New System.Drawing.Size(37, 20)
			Me.fileToolStripMenuItem.Text = "&File"
			' 
			' exitToolStripMenuItem
			' 
			Me.exitToolStripMenuItem.Name = "exitToolStripMenuItem"
			Me.exitToolStripMenuItem.Size = New System.Drawing.Size(92, 22)
			Me.exitToolStripMenuItem.Text = "E&xit"
			AddHandler Me.exitToolStripMenuItem.Click, New System.EventHandler(AddressOf Me.ExitToolStripMenuItem_Click)
			' 
			' readerToolStripMenuItem
			' 
			Me.readerToolStripMenuItem.DropDownItems.AddRange(New System.Windows.Forms.ToolStripItem() {Me.refreshPortsToolStripMenuItem, Me.portToolStripMenuItem, Me.connectToolStripMenuItem, Me.disconnectToolStripMenuItem})
			Me.readerToolStripMenuItem.Name = "readerToolStripMenuItem"
			Me.readerToolStripMenuItem.Size = New System.Drawing.Size(55, 20)
			Me.readerToolStripMenuItem.Text = "&Reader"
			' 
			' refreshPortsToolStripMenuItem
			' 
			Me.refreshPortsToolStripMenuItem.Name = "refreshPortsToolStripMenuItem"
			Me.refreshPortsToolStripMenuItem.Size = New System.Drawing.Size(143, 22)
			Me.refreshPortsToolStripMenuItem.Text = "&Refresh Ports"
			AddHandler Me.refreshPortsToolStripMenuItem.Click, New System.EventHandler(AddressOf Me.RefreshPortsToolStripMenuItem_Click)
			' 
			' portToolStripMenuItem
			' 
			Me.portToolStripMenuItem.Name = "portToolStripMenuItem"
			Me.portToolStripMenuItem.Size = New System.Drawing.Size(143, 22)
			Me.portToolStripMenuItem.Text = "&Port"
			' 
			' connectToolStripMenuItem
			' 
			Me.connectToolStripMenuItem.Name = "connectToolStripMenuItem"
			Me.connectToolStripMenuItem.Size = New System.Drawing.Size(143, 22)
			Me.connectToolStripMenuItem.Text = "&Connect"
			AddHandler Me.connectToolStripMenuItem.Click, New System.EventHandler(AddressOf Me.ConnectToolStripMenuItem_Click)
			' 
			' disconnectToolStripMenuItem
			' 
			Me.disconnectToolStripMenuItem.Name = "disconnectToolStripMenuItem"
			Me.disconnectToolStripMenuItem.Size = New System.Drawing.Size(143, 22)
			Me.disconnectToolStripMenuItem.Text = "&Disconnect"
			AddHandler Me.disconnectToolStripMenuItem.Click, New System.EventHandler(AddressOf Me.DisconnectToolStripMenuItem_Click)
			' 
			' viewToolStripMenuItem
			' 
			Me.viewToolStripMenuItem.DropDownItems.AddRange(New System.Windows.Forms.ToolStripItem() {Me.clearAllResponsesToolStripMenuItem, Me.toolStripSeparator2, Me.clearProtocolResponsesToolStripMenuItem, Me.toolStripSeparator1, Me.showProtocolResponsesToolStripMenuItem})
			Me.viewToolStripMenuItem.Name = "viewToolStripMenuItem"
			Me.viewToolStripMenuItem.Size = New System.Drawing.Size(44, 20)
			Me.viewToolStripMenuItem.Text = "View"
			' 
			' clearAllResponsesToolStripMenuItem
			' 
			Me.clearAllResponsesToolStripMenuItem.Name = "clearAllResponsesToolStripMenuItem"
			Me.clearAllResponsesToolStripMenuItem.Size = New System.Drawing.Size(209, 22)
			Me.clearAllResponsesToolStripMenuItem.Text = "Clear All Responses"
			AddHandler Me.clearAllResponsesToolStripMenuItem.Click, New System.EventHandler(AddressOf Me.ClearAllResponsesToolStripMenuItem_Click)
			' 
			' toolStripSeparator2
			' 
			Me.toolStripSeparator2.Name = "toolStripSeparator2"
			Me.toolStripSeparator2.Size = New System.Drawing.Size(206, 6)
			' 
			' clearProtocolResponsesToolStripMenuItem
			' 
			Me.clearProtocolResponsesToolStripMenuItem.Name = "clearProtocolResponsesToolStripMenuItem"
			Me.clearProtocolResponsesToolStripMenuItem.Size = New System.Drawing.Size(209, 22)
			Me.clearProtocolResponsesToolStripMenuItem.Text = "Clear Protocol Responses"
			AddHandler Me.clearProtocolResponsesToolStripMenuItem.Click, New System.EventHandler(AddressOf Me.ClearProtocolResponsesToolStripMenuItem_Click)
			' 
			' toolStripSeparator1
			' 
			Me.toolStripSeparator1.Name = "toolStripSeparator1"
			Me.toolStripSeparator1.Size = New System.Drawing.Size(206, 6)
			' 
			' showProtocolResponsesToolStripMenuItem
			' 
			Me.showProtocolResponsesToolStripMenuItem.Name = "showProtocolResponsesToolStripMenuItem"
			Me.showProtocolResponsesToolStripMenuItem.Size = New System.Drawing.Size(209, 22)
			Me.showProtocolResponsesToolStripMenuItem.Text = "Show Protocol Responses"
			AddHandler Me.showProtocolResponsesToolStripMenuItem.Click, New System.EventHandler(AddressOf Me.ShowProtocolResponsesToolStripMenuItem_Click)
			' 
			' helpToolStripMenuItem
			' 
			Me.helpToolStripMenuItem.DropDownItems.AddRange(New System.Windows.Forms.ToolStripItem() {Me.aboutToolStripMenuItem})
			Me.helpToolStripMenuItem.Name = "helpToolStripMenuItem"
			Me.helpToolStripMenuItem.Size = New System.Drawing.Size(44, 20)
			Me.helpToolStripMenuItem.Text = "&Help"
			' 
			' aboutToolStripMenuItem
			' 
			Me.aboutToolStripMenuItem.Name = "aboutToolStripMenuItem"
			Me.aboutToolStripMenuItem.Size = New System.Drawing.Size(116, 22)
			Me.aboutToolStripMenuItem.Text = "&About..."
			AddHandler Me.aboutToolStripMenuItem.Click, New System.EventHandler(AddressOf Me.AboutToolStripMenuItem_Click)
			' 
			' mainStatusStrip
			' 
			Me.mainStatusStrip.Items.AddRange(New System.Windows.Forms.ToolStripItem() {Me.messageToolStripStatusLabel})
			Me.mainStatusStrip.Location = New System.Drawing.Point(0, 528)
			Me.mainStatusStrip.Name = "mainStatusStrip"
			Me.mainStatusStrip.Size = New System.Drawing.Size(839, 22)
			Me.mainStatusStrip.TabIndex = 1
			Me.mainStatusStrip.Text = "statusStrip1"
			' 
			' messageToolStripStatusLabel
			' 
			Me.messageToolStripStatusLabel.Name = "messageToolStripStatusLabel"
			Me.messageToolStripStatusLabel.Size = New System.Drawing.Size(118, 17)
			Me.messageToolStripStatusLabel.Text = "No reader connected"
			' 
			' scanRfidButton
			' 
			Me.scanRfidButton.Anchor = CType((System.Windows.Forms.AnchorStyles.Bottom Or System.Windows.Forms.AnchorStyles.Left), System.Windows.Forms.AnchorStyles)
			Me.scanRfidButton.Location = New System.Drawing.Point(12, 303)
			Me.scanRfidButton.Name = "scanRfidButton"
			Me.scanRfidButton.Size = New System.Drawing.Size(75, 51)
			Me.scanRfidButton.TabIndex = 5
			Me.scanRfidButton.Text = "Scan"
			Me.helperToolTip.SetToolTip(Me.scanRfidButton, "Scan for RFID Transponders using a synchronous command")
			Me.scanRfidButton.UseVisualStyleBackColor = True
			AddHandler Me.scanRfidButton.Click, New System.EventHandler(AddressOf Me.ScanRfidCommandButton_Click)
			' 
			' scanBarcodeButton
			' 
			Me.scanBarcodeButton.Anchor = CType((System.Windows.Forms.AnchorStyles.Bottom Or System.Windows.Forms.AnchorStyles.Left), System.Windows.Forms.AnchorStyles)
			Me.scanBarcodeButton.Location = New System.Drawing.Point(21, 303)
			Me.scanBarcodeButton.Name = "scanBarcodeButton"
			Me.scanBarcodeButton.Size = New System.Drawing.Size(75, 51)
			Me.scanBarcodeButton.TabIndex = 8
			Me.scanBarcodeButton.Text = "Scan"
			Me.helperToolTip.SetToolTip(Me.scanBarcodeButton, "Scan for barcodes using a synchronous command")
			Me.scanBarcodeButton.UseVisualStyleBackColor = True
			AddHandler Me.scanBarcodeButton.Click, New System.EventHandler(AddressOf Me.ScanBarcodeCommandButton_Click)
			' 
			' transponderListBox
			' 
			Me.transponderListBox.Anchor = CType((((System.Windows.Forms.AnchorStyles.Top Or System.Windows.Forms.AnchorStyles.Bottom) Or System.Windows.Forms.AnchorStyles.Left) Or System.Windows.Forms.AnchorStyles.Right), System.Windows.Forms.AnchorStyles)
			Me.transponderListBox.Font = New System.Drawing.Font("Courier New", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, CByte(0))
			Me.transponderListBox.FormattingEnabled = True
			Me.transponderListBox.IntegralHeight = False
			Me.transponderListBox.ItemHeight = 16
			Me.transponderListBox.Location = New System.Drawing.Point(8, 30)
			Me.transponderListBox.Name = "transponderListBox"
			Me.transponderListBox.Size = New System.Drawing.Size(394, 267)
			Me.transponderListBox.TabIndex = 1
			' 
			' responsesListBox
			' 
			Me.responsesListBox.Dock = System.Windows.Forms.DockStyle.Fill
			Me.responsesListBox.Font = New System.Drawing.Font("Courier New", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, CByte(0))
			Me.responsesListBox.FormattingEnabled = True
			Me.responsesListBox.IntegralHeight = False
			Me.responsesListBox.ItemHeight = 14
			Me.responsesListBox.Location = New System.Drawing.Point(0, 0)
			Me.responsesListBox.Name = "responsesListBox"
			Me.responsesListBox.Size = New System.Drawing.Size(839, 136)
			Me.responsesListBox.TabIndex = 0
			' 
			' scanRfidAsyncButton
			' 
			Me.scanRfidAsyncButton.Anchor = CType((System.Windows.Forms.AnchorStyles.Bottom Or System.Windows.Forms.AnchorStyles.Left), System.Windows.Forms.AnchorStyles)
			Me.scanRfidAsyncButton.Location = New System.Drawing.Point(93, 303)
			Me.scanRfidAsyncButton.Name = "scanRfidAsyncButton"
			Me.scanRfidAsyncButton.Size = New System.Drawing.Size(75, 51)
			Me.scanRfidAsyncButton.TabIndex = 16
			Me.scanRfidAsyncButton.Text = "Scan (Async)"
			Me.helperToolTip.SetToolTip(Me.scanRfidAsyncButton, "Scan for RFID Transponders using an asynchronous command")
			Me.scanRfidAsyncButton.UseVisualStyleBackColor = True
			AddHandler Me.scanRfidAsyncButton.Click, New System.EventHandler(AddressOf Me.scanRfidAsyncButton_Click)
			' 
			' scanBarcodeAsyncButton
			' 
			Me.scanBarcodeAsyncButton.Anchor = CType((System.Windows.Forms.AnchorStyles.Bottom Or System.Windows.Forms.AnchorStyles.Left), System.Windows.Forms.AnchorStyles)
			Me.scanBarcodeAsyncButton.Location = New System.Drawing.Point(102, 303)
			Me.scanBarcodeAsyncButton.Name = "scanBarcodeAsyncButton"
			Me.scanBarcodeAsyncButton.Size = New System.Drawing.Size(75, 51)
			Me.scanBarcodeAsyncButton.TabIndex = 15
			Me.scanBarcodeAsyncButton.Text = "Scan (Async)"
			Me.helperToolTip.SetToolTip(Me.scanBarcodeAsyncButton, "Scan for barcodes using an asynchronous command")
			Me.scanBarcodeAsyncButton.UseVisualStyleBackColor = True
			AddHandler Me.scanBarcodeAsyncButton.Click, New System.EventHandler(AddressOf Me.ScanBarcodeAsyncButton_Click)
			' 
			' mainSplitContainer
			' 
			Me.mainSplitContainer.Dock = System.Windows.Forms.DockStyle.Fill
			Me.mainSplitContainer.Location = New System.Drawing.Point(0, 24)
			Me.mainSplitContainer.Name = "mainSplitContainer"
			Me.mainSplitContainer.Orientation = System.Windows.Forms.Orientation.Horizontal
			' 
			' mainSplitContainer.Panel1
			' 
			Me.mainSplitContainer.Panel1.Controls.Add(Me.responsesListBox)
			Me.mainSplitContainer.Panel1MinSize = 120
			' 
			' mainSplitContainer.Panel2
			' 
			Me.mainSplitContainer.Panel2.Controls.Add(Me.resultsSplitContainer)
			Me.mainSplitContainer.Size = New System.Drawing.Size(839, 504)
			Me.mainSplitContainer.SplitterDistance = 136
			Me.mainSplitContainer.TabIndex = 10
			' 
			' resultsSplitContainer
			' 
			Me.resultsSplitContainer.Dock = System.Windows.Forms.DockStyle.Fill
			Me.resultsSplitContainer.Location = New System.Drawing.Point(0, 0)
			Me.resultsSplitContainer.Name = "resultsSplitContainer"
			' 
			' resultsSplitContainer.Panel1
			' 
			Me.resultsSplitContainer.Panel1.BackColor = System.Drawing.Color.LightGray
			Me.resultsSplitContainer.Panel1.Controls.Add(Me.panel3)
			Me.resultsSplitContainer.Panel1.Controls.Add(Me.scanRfidAsyncButton)
			Me.resultsSplitContainer.Panel1.Controls.Add(Me.scanRfidButton)
			Me.resultsSplitContainer.Panel1.Controls.Add(Me.panel2)
			' 
			' resultsSplitContainer.Panel2
			' 
			Me.resultsSplitContainer.Panel2.BackColor = System.Drawing.Color.LightGray
			Me.resultsSplitContainer.Panel2.Controls.Add(Me.scanBarcodeAsyncButton)
			Me.resultsSplitContainer.Panel2.Controls.Add(Me.scanBarcodeButton)
			Me.resultsSplitContainer.Panel2.Controls.Add(Me.panel1)
			Me.resultsSplitContainer.Size = New System.Drawing.Size(839, 364)
			Me.resultsSplitContainer.SplitterDistance = 413
			Me.resultsSplitContainer.TabIndex = 16
			' 
			' panel3
			' 
			Me.panel3.Anchor = CType((System.Windows.Forms.AnchorStyles.Bottom Or System.Windows.Forms.AnchorStyles.Left), System.Windows.Forms.AnchorStyles)
			Me.panel3.Controls.Add(Me.label4)
			Me.panel3.Controls.Add(Me.queryTargetComboBox)
			Me.panel3.Controls.Add(Me.label3)
			Me.panel3.Controls.Add(Me.querySessionComboBox)
			Me.panel3.Location = New System.Drawing.Point(174, 306)
			Me.panel3.Name = "panel3"
			Me.panel3.Size = New System.Drawing.Size(193, 55)
			Me.panel3.TabIndex = 15
			' 
			' label4
			' 
			Me.label4.Location = New System.Drawing.Point(3, 27)
			Me.label4.Name = "label4"
			Me.label4.Size = New System.Drawing.Size(86, 21)
			Me.label4.TabIndex = 20
			Me.label4.Text = "Query Target:"
			Me.label4.TextAlign = System.Drawing.ContentAlignment.MiddleRight
			' 
			' queryTargetComboBox
			' 
			Me.queryTargetComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList
			Me.queryTargetComboBox.FormattingEnabled = True
			Me.queryTargetComboBox.Location = New System.Drawing.Point(95, 27)
			Me.queryTargetComboBox.Name = "queryTargetComboBox"
			Me.queryTargetComboBox.Size = New System.Drawing.Size(49, 21)
			Me.queryTargetComboBox.TabIndex = 19
			AddHandler Me.queryTargetComboBox.SelectedIndexChanged, New System.EventHandler(AddressOf Me.QueryTargetComboBox_SelectedIndexChanged)
			' 
			' label3
			' 
			Me.label3.Location = New System.Drawing.Point(3, 0)
			Me.label3.Name = "label3"
			Me.label3.Size = New System.Drawing.Size(86, 21)
			Me.label3.TabIndex = 18
			Me.label3.Text = "Query Session:"
			Me.label3.TextAlign = System.Drawing.ContentAlignment.MiddleRight
			' 
			' querySessionComboBox
			' 
			Me.querySessionComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList
			Me.querySessionComboBox.FormattingEnabled = True
			Me.querySessionComboBox.Location = New System.Drawing.Point(95, 0)
			Me.querySessionComboBox.Name = "querySessionComboBox"
			Me.querySessionComboBox.Size = New System.Drawing.Size(93, 21)
			Me.querySessionComboBox.TabIndex = 17
			AddHandler Me.querySessionComboBox.SelectedIndexChanged, New System.EventHandler(AddressOf Me.QuerySessionComboBox_SelectedIndexChanged)
			' 
			' panel2
			' 
			Me.panel2.Anchor = CType((((System.Windows.Forms.AnchorStyles.Top Or System.Windows.Forms.AnchorStyles.Bottom) Or System.Windows.Forms.AnchorStyles.Left) Or System.Windows.Forms.AnchorStyles.Right), System.Windows.Forms.AnchorStyles)
			Me.panel2.BackColor = System.Drawing.Color.LightGray
			Me.panel2.Controls.Add(Me.clearTransponderResponsesButton)
			Me.panel2.Controls.Add(Me.label2)
			Me.panel2.Controls.Add(Me.transponderListBox)
			Me.panel2.Location = New System.Drawing.Point(0, 0)
			Me.panel2.Name = "panel2"
			Me.panel2.Size = New System.Drawing.Size(413, 306)
			Me.panel2.TabIndex = 15
			' 
			' clearTransponderResponsesButton
			' 
			Me.clearTransponderResponsesButton.Anchor = CType((System.Windows.Forms.AnchorStyles.Top Or System.Windows.Forms.AnchorStyles.Right), System.Windows.Forms.AnchorStyles)
			Me.clearTransponderResponsesButton.Location = New System.Drawing.Point(351, 4)
			Me.clearTransponderResponsesButton.Name = "clearTransponderResponsesButton"
			Me.clearTransponderResponsesButton.Size = New System.Drawing.Size(51, 23)
			Me.clearTransponderResponsesButton.TabIndex = 15
			Me.clearTransponderResponsesButton.Text = "Clear"
			Me.clearTransponderResponsesButton.UseVisualStyleBackColor = True
			AddHandler Me.clearTransponderResponsesButton.Click, New System.EventHandler(AddressOf Me.ClearTransponderResponsesButton_Click)
			' 
			' label2
			' 
			Me.label2.AutoSize = True
			Me.label2.BackColor = System.Drawing.Color.LightGray
			Me.label2.Font = New System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, CByte(0))
			Me.label2.ForeColor = System.Drawing.Color.Black
			Me.label2.Location = New System.Drawing.Point(4, 7)
			Me.label2.Name = "label2"
			Me.label2.Size = New System.Drawing.Size(177, 20)
			Me.label2.TabIndex = 14
			Me.label2.Text = "Transponders Received"
			' 
			' panel1
			' 
			Me.panel1.Anchor = CType((((System.Windows.Forms.AnchorStyles.Top Or System.Windows.Forms.AnchorStyles.Bottom) Or System.Windows.Forms.AnchorStyles.Left) Or System.Windows.Forms.AnchorStyles.Right), System.Windows.Forms.AnchorStyles)
			Me.panel1.BackColor = System.Drawing.Color.LightGray
			Me.panel1.Controls.Add(Me.clearBarcodeResponsesButton)
			Me.panel1.Controls.Add(Me.barcodeListBox)
			Me.panel1.Controls.Add(Me.label1)
			Me.panel1.Location = New System.Drawing.Point(2, 0)
			Me.panel1.Name = "panel1"
			Me.panel1.Size = New System.Drawing.Size(417, 306)
			Me.panel1.TabIndex = 14
			' 
			' clearBarcodeResponsesButton
			' 
			Me.clearBarcodeResponsesButton.Anchor = CType((System.Windows.Forms.AnchorStyles.Top Or System.Windows.Forms.AnchorStyles.Right), System.Windows.Forms.AnchorStyles)
			Me.clearBarcodeResponsesButton.Location = New System.Drawing.Point(357, 4)
			Me.clearBarcodeResponsesButton.Name = "clearBarcodeResponsesButton"
			Me.clearBarcodeResponsesButton.Size = New System.Drawing.Size(51, 23)
			Me.clearBarcodeResponsesButton.TabIndex = 16
			Me.clearBarcodeResponsesButton.Text = "Clear"
			Me.clearBarcodeResponsesButton.UseVisualStyleBackColor = True
			AddHandler Me.clearBarcodeResponsesButton.Click, New System.EventHandler(AddressOf Me.ClearBarcodeResponsesButton_Click)
			' 
			' barcodeListBox
			' 
			Me.barcodeListBox.Anchor = CType((((System.Windows.Forms.AnchorStyles.Top Or System.Windows.Forms.AnchorStyles.Bottom) Or System.Windows.Forms.AnchorStyles.Left) Or System.Windows.Forms.AnchorStyles.Right), System.Windows.Forms.AnchorStyles)
			Me.barcodeListBox.Font = New System.Drawing.Font("Courier New", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, CByte(0))
			Me.barcodeListBox.FormattingEnabled = True
			Me.barcodeListBox.IntegralHeight = False
			Me.barcodeListBox.ItemHeight = 16
			Me.barcodeListBox.Location = New System.Drawing.Point(9, 30)
			Me.barcodeListBox.Name = "barcodeListBox"
			Me.barcodeListBox.Size = New System.Drawing.Size(399, 267)
			Me.barcodeListBox.TabIndex = 12
			' 
			' label1
			' 
			Me.label1.AutoSize = True
			Me.label1.BackColor = System.Drawing.Color.LightGray
			Me.label1.Font = New System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, CByte(0))
			Me.label1.ForeColor = System.Drawing.Color.Black
			Me.label1.Location = New System.Drawing.Point(5, 7)
			Me.label1.Name = "label1"
			Me.label1.Size = New System.Drawing.Size(147, 20)
			Me.label1.TabIndex = 13
			Me.label1.Text = "Barcodes Received"
			' 
			' MainForm
			' 
			Me.AutoScaleDimensions = New System.Drawing.SizeF(6F, 13F)
			Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
			Me.ClientSize = New System.Drawing.Size(839, 550)
			Me.Controls.Add(Me.mainSplitContainer)
			Me.Controls.Add(Me.mainStatusStrip)
			Me.Controls.Add(Me.mainMenuStrip)
			Me.MainMenuStrip = Me.mainMenuStrip
			Me.Name = "MainForm"
			Me.Text = "ASCII Protocol Inventory"
			AddHandler Me.FormClosing, New System.Windows.Forms.FormClosingEventHandler(AddressOf Me.MainForm_FormClosing)
			Me.mainMenuStrip.ResumeLayout(False)
			Me.mainMenuStrip.PerformLayout()
			Me.mainStatusStrip.ResumeLayout(False)
			Me.mainStatusStrip.PerformLayout()
			Me.mainSplitContainer.Panel1.ResumeLayout(False)
			Me.mainSplitContainer.Panel2.ResumeLayout(False)
			Me.mainSplitContainer.ResumeLayout(False)
			Me.resultsSplitContainer.Panel1.ResumeLayout(False)
			Me.resultsSplitContainer.Panel2.ResumeLayout(False)
			Me.resultsSplitContainer.ResumeLayout(False)
			Me.panel3.ResumeLayout(False)
			Me.panel2.ResumeLayout(False)
			Me.panel2.PerformLayout()
			Me.panel1.ResumeLayout(False)
			Me.panel1.PerformLayout()
			Me.ResumeLayout(False)
			Me.PerformLayout()

		End Sub

		#End Region

        Private fileToolStripMenuItem As System.Windows.Forms.ToolStripMenuItem
		Private exitToolStripMenuItem As System.Windows.Forms.ToolStripMenuItem
		Private helpToolStripMenuItem As System.Windows.Forms.ToolStripMenuItem
		Private aboutToolStripMenuItem As System.Windows.Forms.ToolStripMenuItem
		Private mainStatusStrip As System.Windows.Forms.StatusStrip
		Private scanRfidButton As System.Windows.Forms.Button
		Private readerToolStripMenuItem As System.Windows.Forms.ToolStripMenuItem
		Private portToolStripMenuItem As System.Windows.Forms.ToolStripMenuItem
		Private connectToolStripMenuItem As System.Windows.Forms.ToolStripMenuItem
		Private disconnectToolStripMenuItem As System.Windows.Forms.ToolStripMenuItem
		Private responsesListBox As System.Windows.Forms.ListBox
		Private scanBarcodeButton As System.Windows.Forms.Button
		Private transponderListBox As System.Windows.Forms.ListBox
		Private helperToolTip As System.Windows.Forms.ToolTip
		Private refreshPortsToolStripMenuItem As System.Windows.Forms.ToolStripMenuItem
		Private messageToolStripStatusLabel As System.Windows.Forms.ToolStripStatusLabel
		Private mainSplitContainer As System.Windows.Forms.SplitContainer
		Private panel1 As System.Windows.Forms.Panel
		Private barcodeListBox As System.Windows.Forms.ListBox
		Private label1 As System.Windows.Forms.Label
		Private panel2 As System.Windows.Forms.Panel
		Private label2 As System.Windows.Forms.Label
		Private resultsSplitContainer As System.Windows.Forms.SplitContainer
		Private viewToolStripMenuItem As System.Windows.Forms.ToolStripMenuItem
		Private showProtocolResponsesToolStripMenuItem As System.Windows.Forms.ToolStripMenuItem
		Private scanRfidAsyncButton As System.Windows.Forms.Button
		Private scanBarcodeAsyncButton As System.Windows.Forms.Button
		Private toolStripSeparator1 As System.Windows.Forms.ToolStripSeparator
		Private clearAllResponsesToolStripMenuItem As System.Windows.Forms.ToolStripMenuItem
		Private clearProtocolResponsesToolStripMenuItem As System.Windows.Forms.ToolStripMenuItem
		Private querySessionComboBox As System.Windows.Forms.ComboBox
		Private label3 As System.Windows.Forms.Label
		Private panel3 As System.Windows.Forms.Panel
		Private label4 As System.Windows.Forms.Label
		Private queryTargetComboBox As System.Windows.Forms.ComboBox
		Private clearTransponderResponsesButton As System.Windows.Forms.Button
		Private clearBarcodeResponsesButton As System.Windows.Forms.Button
		Private toolStripSeparator2 As System.Windows.Forms.ToolStripSeparator
	End Class
End Namespace

