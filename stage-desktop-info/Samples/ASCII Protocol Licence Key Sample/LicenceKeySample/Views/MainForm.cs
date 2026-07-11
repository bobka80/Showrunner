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

    using Entities;
    using TechnologySolutions.ModelViewViewModel;
    using TechnologySolutions.ModelViewViewModel.Views;
    using ViewModels;

    /// <summary>
    /// Main form of the application
    /// </summary>
    public partial class MainForm : Form
    {
        /// <summary>
        /// The view model to manage the reader connection
        /// </summary>
        private ConnectViewModel connectionViewModel;

        /// <summary>
        /// The main view model for the form
        /// </summary>
        private MainViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the MainForm class
        /// </summary>
        public MainForm()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<MainViewModel>();

            if (this.viewModel != null)
            {
                // bind the view model to the form
                this.authoriseToolStripMenuItem.Bind("Enabled", this.viewModel, "CanExecuteAuthoriseReader");
                this.authorisedOnlyCheckBox.Bind("Checked", this.viewModel, "IsAuthorisedReadersOnlyEnabled");
                this.barcodeButton.Bind("Enabled", this.viewModel, "CanExecuteBarcode");
                this.deauthoriseToolStripMenuItem.Bind("Enabled", this.viewModel, "CanExecuteDeauthoriseReader");
                this.inventoryButton.Bind("Enabled", this.viewModel, "CanExecuteInventory");
                this.authorisationToolStripStatusLabel.OneWayBind("Text", this.viewModel, "AuthorisedStatus");
                this.DataBindings.Add("IsAuthorised", this.viewModel, "IsAuthorised");

                this.viewModel.Message += this.ViewModel_Message;

                this.connectionViewModel = ViewModelLocator.ViewModel<ConnectViewModel>();
                this.connectionToolStripStatusLabel.OneWayBind("Text", this.connectionViewModel, "ConnectionStatus");
                this.connectToolStripMenuItem.Bind("Enabled", this.connectionViewModel, "CanExecuteConnect");
                this.disconnectToolStripMenuItem.Bind("Enabled", this.connectionViewModel, "CanExecuteDisconnect");

                this.connectionNameComboBox.DataSource = this.connectionViewModel.ConnectionNames;
                this.connectionNameComboBox.DataBindings.Add("Text", this.connectionViewModel, "ConnectionName", false, DataSourceUpdateMode.OnPropertyChanged);
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the connected reader is authorised
        /// </summary>
        public bool IsAuthorised
        {
            get
            {
                return this.authorisationToolStripStatusLabel.BackColor == Color.LimeGreen;
            }

            set
            {
                this.authorisationToolStripStatusLabel.BackColor = value ? Color.LimeGreen : Color.Silver;
            }
        }

        /// <summary>
        /// Exits the application
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ExitToolStripMenuItem_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        /// <summary>
        /// Updates the view model as to whether the inventory should be perform synchronously or asynchronously
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void SynchronousCheckBox_CheckStateChanged(object sender, EventArgs e)
        {
            this.viewModel.IsAuthorisedReadersOnlyEnabled = this.authorisedOnlyCheckBox.Checked;
        }

        /// <summary>
        /// Handle when a new transponder is received
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        /// <remarks>
        /// This isn't exactly model binding is it?
        /// </remarks>
        private void ViewModel_Message(object sender, TextEventArgs e)
        {
            this.outputListBox.SuspendLayout();
            this.outputListBox.Items.Add(e.Text);
            this.outputListBox.SelectedIndex = this.outputListBox.Items.Count - 1;
            this.outputListBox.ResumeLayout();
        }

        /// <summary>
        /// Authorise the connected reader
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void AuthoriseToolStripMenuItem_Click(object sender, EventArgs e)
        {
            System.Threading.ThreadPool.QueueUserWorkItem(delegate(object state) { this.viewModel.ExecuteAuthoriseReader(); });
        }

        /// <summary>
        /// Perform a barcode scan
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void BarcodeButton_Click(object sender, EventArgs e)
        {
            System.Threading.ThreadPool.QueueUserWorkItem(delegate(object state) { this.viewModel.ExecuteBarcode(); });
        }

        /// <summary>
        /// Clear the message list
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ClearMessagesToolStripMenuItem_Click(object sender, EventArgs e)
        {
            this.outputListBox.Items.Clear(); // should be from viewmodel
        }

        /// <summary>
        /// Connect to the reader
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ConnectToolStripMenuItem_Click(object sender, EventArgs e)
        {
            System.Threading.ThreadPool.QueueUserWorkItem((state) => { this.connectionViewModel.ExecuteConnect(); });
        }

        /// <summary>
        /// Disconnect from the reader
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void DisconnectToolStripMenuItem_Click(object sender, EventArgs e)
        {
            System.Threading.ThreadPool.QueueUserWorkItem((state) => { this.connectionViewModel.ExecuteDisconnect(); });
        }

        /// <summary>
        /// Deauthorise the connected reader by removing the licence key
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void DeauthoriseToolStripMenuItem_Click(object sender, EventArgs e)
        {
            System.Threading.ThreadPool.QueueUserWorkItem(delegate(object state) { this.viewModel.ExecuteDeauthoriseReader(); });
        }

        /// <summary>
        /// Attempt to perform an inventory
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void InventoryButton_Click(object sender, EventArgs e)
        {
            System.Threading.ThreadPool.QueueUserWorkItem(delegate(object state) { this.viewModel.ExecuteInventory(); });
        }
    }
}