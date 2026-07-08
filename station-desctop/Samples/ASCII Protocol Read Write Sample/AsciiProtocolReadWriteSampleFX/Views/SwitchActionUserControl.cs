//-----------------------------------------------------------------------
// <copyright file="SwitchActionUserControl.cs" company="Technology Solutions UK Ltd"> 
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
    using TechnologySolutions.Rfid.AsciiProtocol; // for SwitchAction
    using ViewModels;

    /// <summary>
    /// User control to configure the reader's switch actions
    /// </summary>
    public partial class SwitchActionUserControl 
        : UserControl
    {
        /// <summary>
        /// Container for the ICommand to control bindings
        /// </summary>
        private List<CommandBinder> commandBindings;

        /// <summary>
        /// Provides the implementation of the view
        /// </summary>
        private SwitchActionViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the SwitchActionUserControl class
        /// </summary>
        public SwitchActionUserControl()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<SwitchActionViewModel>();

            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();
                
                this.switchAsynchronousMessagesCheckBox.DataBindings.Add("Checked", this.viewModel, "IsAsynchronousReportingEnabled");

                this.switchDoublePressActionComboBox.DataSource = Enum.GetValues(typeof(SwitchAction));
                this.switchDoublePressActionComboBox.DataBindings.Add("SelectedItem", this.viewModel, "DoublePressAction");
                this.switchDoublePressActionComboBox.FormattingEnabled = true;
                this.switchDoublePressActionComboBox.Format += delegate(object sender, ListControlConvertEventArgs e)
                {
                    e.Value = ((SwitchAction)e.Value).Description();
                };

                this.switchSinglePressActionComboBox.DataSource = Enum.GetValues(typeof(SwitchAction));
                this.switchSinglePressActionComboBox.DataBindings.Add("SelectedItem", this.viewModel, "SinglePressAction");
                this.switchSinglePressActionComboBox.FormattingEnabled = true;
                this.switchSinglePressActionComboBox.Format += delegate(object sender, ListControlConvertEventArgs e)
                {
                    e.Value = ((SwitchAction)e.Value).Description();
                };

                this.singlePressUserActionTextBox.DataBindings.Add("Text", this.viewModel, "SinglePressUserAction");
                this.doublePressUserActionTextBox.DataBindings.Add("Text", this.viewModel, "DoublePressUserAction");

                this.commandBindings.Add(new ButtonBinder(this.switchActionApplyButton, this.viewModel.ApplySwitchActionCommand));
                this.commandBindings.Add(new ButtonBinder(this.switchActionReadButton, this.viewModel.ReadSwitchActionCommand));
                this.commandBindings.Add(new ButtonBinder(this.switchDoublePressUserActionApplyButton, this.viewModel.ApplyDoublePressUserAction));
                this.commandBindings.Add(new ButtonBinder(this.switchDoublePressUserActionReadButton, this.viewModel.ReadDoublePressUserAction));
                this.commandBindings.Add(new ButtonBinder(this.switchSinglePressUserActionApplyButton, this.viewModel.ApplySinglePressUserAction));
                this.commandBindings.Add(new ButtonBinder(this.switchSinglePressUserActionReadButton, this.viewModel.ReadSinglePressUserAction));
            }
        }
    }
}
