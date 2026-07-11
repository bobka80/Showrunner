//-----------------------------------------------------------------------
// <copyright file="MainForm.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Views
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Data;
    using System.Drawing;
    using System.Linq;
    using System.Text;
    using System.Windows.Forms;

    using TechnologySolutions.ModelViewViewModel;
    using TechnologySolutions.ModelViewViewModel.Views;
    using TechnologySolutions.Rfid.AsciiProtocol;
    using ViewModels;

    /// <summary>
    /// Main view for the application
    /// </summary>
    public partial class MainForm 
        : Form
    {
        /// <summary>
        /// Handles conencting to the reader
        /// </summary>
        private ConnectViewModel connectViewModel;

        /// <summary>
        /// Handles responses and messages
        /// </summary>
        private ResponsesViewModel responseViewModel;

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

            this.responseViewModel = ViewModelLocator.ViewModel<ResponsesViewModel>();
            if (this.responseViewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();

                // bind the responses view model
                this.responseSplitContainer.Bind("Panel1Collapsed", this.responseViewModel, "IsNotProtocolResponseWindowVisible");
                this.showProtocolResponsesToolStripMenuItem.Bind("Checked", this.responseViewModel, "IsProtocolResponseWindowVisible");
                this.messagesListBox.Tag = new ListBoxBinding(this.messagesListBox, this.responseViewModel.Messages);
                this.responsesListBox.Tag = new ListBoxBinding(this.responsesListBox, this.responseViewModel.Responses);
                                
                this.commandBindings.Bind(this.clearMessagesButton, this.responseViewModel.ClearMessages);
                this.commandBindings.Bind(this.clearProtocolResponsesToolStripMenuItem, this.responseViewModel.ClearResponses);
                this.commandBindings.Bind(this.clearAllResponsesToolStripMenuItem, this.responseViewModel.ClearMessagesAndResponses);
                this.commandBindings.Bind(this.showProtocolResponsesToolStripMenuItem, this.responseViewModel.ToggleIsProtocolResponseWindowVisible);

                // bind the connection view model
                this.connectViewModel = ViewModelLocator.ViewModel<ConnectViewModel>();
                this.connectViewModel.PropertyChanged += this.ConnectViewModel_PropertyChanged;
                this.messageToolStripStatusLabel.Tag = new OneWayBinder(this.messageToolStripStatusLabel, "Text", this.connectViewModel, "ConnectionStatus");
                this.commandBindings.Bind(this.connectToolStripMenuItem, this.connectViewModel.ConnectCommand);
                this.commandBindings.Bind(this.disconnectToolStripMenuItem, this.connectViewModel.DisconnectCommand);
                this.commandBindings.Bind(this.refreshPortsToolStripMenuItem, this.connectViewModel.RefreshPortsCommand);

                //this.connectViewModel.RefreshPortsCommand.Execute(null);
            }

            this.Load += this.Form_Load;
        }        

        /// <summary>
        /// Gets or sets the list of available com ports
        /// </summary>
        public IEnumerable<string> PortNames
        {
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
                            item.Checked = item == sender;// false;
                        }

                        this.connectViewModel.PortName = (sender as ToolStripMenuItem).Text;
                        //(sender as ToolStripMenuItem).Checked = true;
                    };

                    this.portToolStripMenuItem.DropDownItems.Add(menuItem);
                }
            }
        }

        /// <summary>
        /// Manual property bind of list of port names. Refresh the UI list when the list is changed
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ConnectViewModel_PropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName.Equals("PortNames", StringComparison.OrdinalIgnoreCase))
            {
                this.PortNames = this.connectViewModel.PortNames;
            }
        }

        /// <summary>
        /// Closes the form to exit the application
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ExitToolStripMenuItem_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        /// <summary>
        /// Setup the view as it is loaded
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Form_Load(object sender, EventArgs e)
        {
            this.PortNames = this.connectViewModel.PortNames; // TODO: observable list?

            // Configure minimum sizes here to work round a UI designer bug
            this.responseSplitContainer.Panel1MinSize = 120;
            this.responseSplitContainer.Panel2MinSize = 240;
        }        

        /// <summary>
        /// Show the text of the currently selected line in the list on the text box
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided with the event</param>
        private void MessagesListBox_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (this.messagesListBox.SelectedItem != null)
            {
                this.textBox1.Text = this.messagesListBox.SelectedItem.ToString();
            }
        }        
    }
}
