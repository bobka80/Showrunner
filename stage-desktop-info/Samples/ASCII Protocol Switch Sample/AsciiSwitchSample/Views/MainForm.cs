//-----------------------------------------------------------------------
// <copyright file="MainForm.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocol.Sample.Views
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Data;
    using System.Drawing;
    using System.Linq;
    using System.Text;
    using System.Windows.Forms;
    
    using TechnologySolutions.Rfid.AsciiProtocol;
    using ViewModels;

    /// <summary>
    /// Main view for the application
    /// </summary>
    public partial class MainForm 
        : Form
    {
        /// <summary>
        /// Handles executing reader commands
        /// </summary>
        private CommandsViewModel commandsViewModel;

        /// <summary>
        /// Handles conencting to the reader
        /// </summary>
        private ConnectViewModel connectViewModel;

        /// <summary>
        /// Handles commanding the reader
        /// </summary>
        private MainViewModel viewModel;

        /// <summary>
        /// Handles switch action commands
        /// </summary>
        private SwitchActionViewModel switchActionViewModel;

        /// <summary>
        /// List of all the user interface elements that are bound to <see cref="ICommand"/>s
        /// </summary>
        private List<CommandBinder> commandBindings;

        /// <summary>
        /// Initializes a new instance of the MainForm class
        /// </summary>
        public MainForm()
        {
            this.InitializeComponent();

            this.commandBindings = new List<CommandBinder>();

            this.viewModel = new MainViewModel();

            // TODO: replace with this.viewModel.PropertyChanged 
            this.viewModel.Message += this.ViewModel_Message;
            this.viewModel.ResponseLine += this.ViewModel_ResponseLine;
            
            this.connectViewModel = new ConnectViewModel();
            this.connectViewModel.PortName = Service.Settings.PortName;
            this.DataBindings.Add("ConnectionStatus", this.connectViewModel, "ConnectionStatus");

            this.commandsViewModel = new CommandsViewModel();
            this.switchDurationNumericUpDown.DataBindings.Add("Value", this.commandsViewModel, "SwitchPressTimeout");

            this.switchActionViewModel = new SwitchActionViewModel();
            this.switchAsynchronousMessagesCheckBox.DataBindings.Add("Checked", this.switchActionViewModel, "IsAsynchronousReportingEnabled");

            // Create a menu of session values
            this.querySessionComboBox.DataSource = Enum.GetValues(typeof(QuerySession));
            this.querySessionComboBox.DataBindings.Add("SelectedItem", this.viewModel, "Session");

            // Use the description when displaying to the user
            this.querySessionComboBox.FormattingEnabled = true;
            this.querySessionComboBox.Format += delegate(object sender, ListControlConvertEventArgs e)
            {
                e.Value = ((QuerySession)e.Value).Description();
            };

            this.queryTargetComboBox.DataSource = Enum.GetValues(typeof(QueryTarget));
            this.queryTargetComboBox.DataBindings.Add("SelectedItem", this.viewModel, "Target");
            this.queryTargetComboBox.FormattingEnabled = true;
            this.queryTargetComboBox.Format += delegate(object sender, ListControlConvertEventArgs e)
            {
                e.Value = ((QueryTarget)e.Value).Description();
            };

            this.switchDoublePressActionComboBox.DataSource = Enum.GetValues(typeof(SwitchAction));
            this.switchDoublePressActionComboBox.DataBindings.Add("SelectedItem", this.switchActionViewModel, "DoublePressAction");
            this.switchDoublePressActionComboBox.FormattingEnabled = true;
            this.switchDoublePressActionComboBox.Format += delegate(object sender, ListControlConvertEventArgs e)
            {
                e.Value = ((SwitchAction)e.Value).Description();
            };
            
            this.switchSinglePressActionComboBox.DataSource = Enum.GetValues(typeof(SwitchAction));
            this.switchSinglePressActionComboBox.DataBindings.Add("SelectedItem", this.switchActionViewModel, "SinglePressAction");
            this.switchSinglePressActionComboBox.FormattingEnabled = true;
            this.switchSinglePressActionComboBox.Format += delegate(object sender, ListControlConvertEventArgs e)
            {
                e.Value = ((SwitchAction)e.Value).Description();
            };

            // bind commands from the view models directly to the user interface
            this.commandBindings.Add(new ToolStripMenuItemBinder(this.connectToolStripMenuItem, this.connectViewModel.ConnectCommand));
            this.commandBindings.Add(new ToolStripMenuItemBinder(this.disconnectToolStripMenuItem, this.connectViewModel.DisconnectCommand));
            this.commandBindings.Add(new ToolStripMenuItemBinder(this.refreshPortsToolStripMenuItem, this.connectViewModel.RefreshPortsCommand));

            this.commandBindings.Add(new ButtonBinder(this.abortCommandButton, this.commandsViewModel.AbortCommand));
            this.commandBindings.Add(new ButtonBinder(this.factoryDefaultsButton, this.commandsViewModel.FactoryDefaultsCommand));
            this.commandBindings.Add(new ButtonBinder(this.switchDoublePressButton, this.commandsViewModel.SwitchDoublePressCommand));
            this.commandBindings.Add(new ButtonBinder(this.switchSinglePressButton, this.commandsViewModel.SwitchSinglePressCommand));

            this.commandBindings.Add(new ButtonBinder(this.switchActionApplyButton, this.switchActionViewModel.ApplySwitchActionCommand));
            this.commandBindings.Add(new ButtonBinder(this.switchActionReadButton, this.switchActionViewModel.ReadSwitchActionCommand));
            this.commandBindings.Add(new ButtonBinder(this.switchDoublePressUserActionApplyButton, this.switchActionViewModel.ApplyDoublePressUserAction));
            this.commandBindings.Add(new ButtonBinder(this.switchDoublePressUserActionReadButton, this.switchActionViewModel.ReadDoublePressUserAction));
            this.commandBindings.Add(new ButtonBinder(this.switchSinglePressUserActionApplyButton, this.switchActionViewModel.ApplySinglePressUserAction));
            this.commandBindings.Add(new ButtonBinder(this.switchSinglePressUserActionReadButton, this.switchActionViewModel.ReadSinglePressUserAction));
            this.singlePressUserActionTextBox.DataBindings.Add("Text", this.switchActionViewModel, "SinglePressUserAction");
            this.doublePressUserActionTextBox.DataBindings.Add("Text", this.switchActionViewModel, "DoublePressUserAction");

            this.commandBindings.Add(new ButtonBinder(this.scanRfidAsyncButton, this.viewModel.InventoryAsynchronous));
            this.commandBindings.Add(new ButtonBinder(this.scanRfidButton, this.viewModel.InventorySynchronous));
            this.commandBindings.Add(new ButtonBinder(this.scanBarcodeAsyncButton, this.viewModel.BarcodeAsynchronous));
            this.commandBindings.Add(new ButtonBinder(this.scanBarcodeButton, this.viewModel.BarcodeSynchronous));
            this.commandBindings.Add(new ButtonBinder(this.readSwitchStateButton, this.viewModel.ReadSwitchState));
            
            this.Load += this.Form_Load;
        }

        /// <summary>
        /// Gets or sets the connection status displayed in the status bar
        /// </summary>
        public string ConnectionStatus
        {
            get
            {
                return this.messageToolStripStatusLabel.Text;
            }

            set
            {
                this.messageToolStripStatusLabel.Text = value;
            }
        }        

        /// <summary>
        /// Gets or sets the list of available com ports
        /// </summary>
        public IEnumerable<string> PortNames
        {
            get
            {
                foreach (ToolStripDropDownItem item in this.portToolStripMenuItem.DropDownItems)
                {
                    yield return item.Name;
                }
            }

            set
            {
                string selectedPortName;

                selectedPortName = this.connectViewModel.PortName;
                this.portToolStripMenuItem.DropDownItems.Clear();
                foreach (string portName in value)
                {
                    ToolStripMenuItem menuItem;

                    menuItem = new ToolStripMenuItem()
                    {
                        Text = portName,
                        Checked = selectedPortName.Equals(portName)
                    };

                    menuItem.Click += delegate(object sender, EventArgs e)
                    {
                        foreach (ToolStripMenuItem item in this.portToolStripMenuItem.DropDownItems)
                        {
                            item.Checked = false;
                        }

                        this.connectViewModel.PortName = (sender as ToolStripMenuItem).Text;
                        (sender as ToolStripMenuItem).Checked = true;
                    };

                    this.portToolStripMenuItem.DropDownItems.Add(menuItem);
                }
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the protocol response window is visible
        /// </summary>
        private bool IsProtocolResponseWindowVisible
        {
            get
            {
                return this.showProtocolResponsesToolStripMenuItem.Checked;
            }

            set
            {
                this.mainSplitContainer.Panel1Collapsed = !value;
                this.showProtocolResponsesToolStripMenuItem.Checked = value;
            }
        }

        /// <summary>
        /// Setup the form as it loads
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Form_Load(object sender, EventArgs e)
        {
            this.PortNames = this.connectViewModel.PortNames; // TODO: observable list?

            // Configure minimum sizes here to work round a UI designer bug
            this.mainSplitContainer.Panel1MinSize = 120;
            this.mainSplitContainer.Panel2MinSize = 240;

            this.IsProtocolResponseWindowVisible = Service.Settings.IsProtocolResponsePanelVisible;
        }

        /// <summary>
        /// Display a message from the view model
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ViewModel_Message(object sender, TextEventArgs e)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new EventHandler<TextEventArgs>(this.ViewModel_Message), new object[] { sender, e });
            }
            else
            {
                this.DisplayText(this.messagesListBox, e.Text);
            }
        }

        /// <summary>
        /// Display an ASCII response line from the reader
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ViewModel_ResponseLine(object sender, TextEventArgs e)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new EventHandler<TextEventArgs>(this.ViewModel_ResponseLine), new object[] { sender, e });
            }
            else
            {
                this.DisplayText(this.responsesListBox, e.Text);
            }
        }

        /// <summary>
        /// Display text in a ListBox
        /// </summary>
        /// <param name="listBox">The list box to add the item to</param>
        /// <param name="value">The text to display</param>
        private void DisplayText(ListBox listBox, string value)
        {
            listBox.SuspendLayout();
            if (listBox.Items.Count > 10000)
            {
                for (int i = 0; i < 50; i++)
                {
                    listBox.Items.RemoveAt(0);
                }
            }

            listBox.Items.Add(value);
            listBox.SelectedIndex = listBox.Items.Count - 1;
            listBox.ResumeLayout();
        }

        /// <summary>
        /// Clear the protocol responses
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ClearProtocolResponsesToolStripMenuItem_Click(object sender, EventArgs e)
        {
            this.responsesListBox.Items.Clear();
        }

        /// <summary>
        /// Clear the transponder responses
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ClearTransponderResponsesButton_Click(object sender, EventArgs e)
        {
            this.messagesListBox.Items.Clear();
        }

        /// <summary>
        /// Clear the transponder responses
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ClearTransponderResponsesToolStripMenuItem_Click(object sender, EventArgs e)
        {
            this.messagesListBox.Items.Clear();
        }

        /// <summary>
        /// Clear all the responses
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ClearAllResponsesToolStripMenuItem_Click(object sender, EventArgs e)
        {
            this.responsesListBox.Items.Clear();
            this.messagesListBox.Items.Clear();
        }

        /// <summary>
        /// Exit the application
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ExitToolStripMenuItem_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        /// <summary>
        /// Saves the settings as the form closes
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            Service.Settings.PortName = this.connectViewModel.PortName;
            Service.Settings.IsProtocolResponsePanelVisible = this.IsProtocolResponseWindowVisible;
            Service.Settings.Save();
        }

        /// <summary>
        /// Toggles the protocol responses view visible or not
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ShowProtocolResponsesToolStripMenuItem_Click(object sender, EventArgs e)
        {
            this.IsProtocolResponseWindowVisible = !this.IsProtocolResponseWindowVisible;
        }        
    }
}
