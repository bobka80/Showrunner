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

            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();
                
                this.bankComboBox.DataSource = Enum.GetValues(typeof(TechnologySolutions.Rfid.AsciiProtocol.Databank));
                this.bankComboBox.DataBindings.Add("SelectedItem", this.viewModel, "Bank");
                this.dataTextBox.DataBindings.Add("Text", this.viewModel, "Data");
                this.lengthTextBox.DataBindings.Add("Text", this.viewModel, "LengthWords");
                this.startTextBox.DataBindings.Add("Text", this.viewModel, "OffsetWords");
                this.selectMaskTextBox.DataBindings.Add("Text", this.viewModel, "SelectMask");
                this.targetComboBox.DataSource = Enum.GetValues(typeof(TargetTransponder));
                this.targetComboBox.DataBindings.Add("SelectedItem", this.viewModel, "Target");

                this.commandBindings.Add(new ButtonBinder(this.readButton, this.viewModel.ReadCommand));
                this.commandBindings.Add(new ButtonBinder(this.writeButton, this.viewModel.WriteCommand));
                this.commandBindings.Add(new ButtonBinder(this.writeSingleButton, this.viewModel.WriteSingleCommand));
            }
        }
    }
}
