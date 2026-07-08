//-----------------------------------------------------------------------
// <copyright file="SwitchUserControl.cs" company="Technology Solutions UK Ltd"> 
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
    /// User control with an interface to command the reader's switch functions
    /// </summary>
    public partial class SwitchUserControl 
        : UserControl
    {
        /// <summary>
        /// Container for the ICommand to control bindings
        /// </summary>
        private List<CommandBinder> commandBindings;

        /// <summary>
        /// ViewModel to command the reader
        /// </summary>
        private SwitchViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the SwitchUserControl class
        /// </summary>
        public SwitchUserControl()
        {
            this.InitializeComponent();
            
            this.viewModel = ViewModelLocator.ViewModel<SwitchViewModel>();

            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();

                this.switchDurationNumericUpDown.DataBindings.Add("Value", this.viewModel, "SwitchPressTimeout");
                this.commandBindings.Add(new ButtonBinder(this.switchDoublePressButton, this.viewModel.SwitchDoublePressCommand));
                this.commandBindings.Add(new ButtonBinder(this.switchSinglePressButton, this.viewModel.SwitchSinglePressCommand));
                this.commandBindings.Add(new ButtonBinder(this.readSwitchStateButton, this.viewModel.ReadSwitchState));
            }
        }
    }
}
