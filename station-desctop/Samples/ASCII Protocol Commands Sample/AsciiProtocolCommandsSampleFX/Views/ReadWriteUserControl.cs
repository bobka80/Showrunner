//-----------------------------------------------------------------------
// <copyright file="ReadWriteUserControl.cs" company="Technology Solutions UK Ltd"> 
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

    using TechnologySolutions.ModelViewViewModel.Views;
    using ViewModels;

    /// <summary>
    /// Provides a user interface to read and write to transponders
    /// </summary>
    public partial class ReadWriteUserControl
        : UserControl
    {
        /// <summary>
        /// Container for bindings between ICommands and controls
        /// </summary>
        private List<CommandBinder> commandBindings;

        /// <summary>
        /// ViewModel that provides the interface between the application and the view
        /// </summary>
        private ReadWriteViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the ReadWriteUserControl class
        /// </summary>
        public ReadWriteUserControl()
        {
            this.InitializeComponent();
            
            this.viewModel = ViewModelLocator.ViewModel<ReadWriteViewModel>();

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();

                // data parameters
                this.dataBankComboBox.DataSource = this.viewModel.Banks;
                this.dataBankComboBox.DataBindings.Add("SelectedItem", this.viewModel, "Bank");
                this.dataTextBox.DataBindings.Add("Text", this.viewModel, "Data");
                this.dataLengthTextBox.DataBindings.Add("Text", this.viewModel, "LengthWords");
                this.dataOffsetTextBox.DataBindings.Add("Text", this.viewModel, "OffsetWords");

                // lock parameters
                this.lockAccessPasswordRestrictionComboBox.DataSource = this.viewModel.Lock.PasswordRestrictions;
                this.lockAccessPasswordRestrictionComboBox.DataBindings.Add("SelectedItem", this.viewModel.Lock, "AccessPasswordRestriction");
                this.lockEpcMemoryRestrictionComboBox.DataSource = this.viewModel.Lock.MemoryBankRestrictions;
                this.lockEpcMemoryRestrictionComboBox.DataBindings.Add("SelectedItem", this.viewModel.Lock, "EpcMemoryBankRestriction");
                this.lockKillPasswordRestrictionComboBox.DataSource = this.viewModel.Lock.PasswordRestrictions;
                this.lockKillPasswordRestrictionComboBox.DataBindings.Add("SelectedItem", this.viewModel.Lock, "KillPasswordRestriction");
                this.lockTidMemoryRestrictionComboBox.DataSource = this.viewModel.Lock.MemoryBankRestrictions;
                this.lockTidMemoryRestrictionComboBox.DataBindings.Add("SelectedItem", this.viewModel.Lock, "TidMemoryBankRestriction");
                this.lockUserMemoryRestrictionComboBox.DataSource = this.viewModel.Lock.MemoryBankRestrictions;
                this.lockUserMemoryRestrictionComboBox.DataBindings.Add("SelectedItem", this.viewModel.Lock, "UserMemoryBankRestriction");

                // password parameters
                this.accessPasswordTextBox.DataBindings.Add("Text", this.viewModel, "AccessPassword");
                this.killPasswordTextBox.DataBindings.Add("Text", this.viewModel, "KillPassword");

                // Q parameters
                this.valueOfQTrackBar.DataBindings.Add("Value", this.viewModel, "QValue");
                this.valueOfQTrackBar.ValueChanged += delegate(object sender, EventArgs e)
                {
                    // Update the label with the value of the track bar as it changes
                    this.valueOfQGroupBox.Text = string.Format(
                            System.Globalization.CultureInfo.CurrentUICulture,
                            "Q Value {0}",
                            this.valueOfQTrackBar.Value);
                };

                // select parameters            
                this.commandBindings.Bind(this.selectDataEpcButton, this.viewModel.SelectDataEpcCommand);
                this.commandBindings.Bind(this.selectDataTidButton, this.viewModel.SelectDataTidCommand);
                this.commandBindings.Bind(this.selectDataNoneButton, this.viewModel.SelectDataNoneCommand);

                // IComand bindings
                this.commandBindings.Bind(this.lockButton, this.viewModel.LockCommand);
                this.commandBindings.Bind(this.readButton, this.viewModel.ReadCommand);
                this.commandBindings.Bind(this.writeButton, this.viewModel.WriteCommand);
                this.commandBindings.Bind(this.writeSingleButton, this.viewModel.WriteSingleCommand);
            }
        }
    }
}
