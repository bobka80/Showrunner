//-----------------------------------------------------------------------
// <copyright file="CommonParametersUserControl.cs" company="Technology Solutions UK Ltd"> 
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

    using ViewModels;

    /// <summary>
    /// User control to edit the common parameters used for various commands
    /// </summary>
    public partial class CommonParametersUserControl 
        : UserControl
    {
        /// <summary>
        /// View mdoel for the common parameters
        /// </summary>
        private CommonParametersViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the CommonParametersUserControl class
        /// </summary>
        public CommonParametersUserControl()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<CommonParametersViewModel>();

            if (this.viewModel != null)
            {
                this.includeDateTimeCheckBox.DataBindings.Add("CheckState", this.viewModel, "IncludeDateTime");
                this.useAlertCheckBox.DataBindings.Add("CheckState", this.viewModel, "UseAlert");

                this.includeChecksumCheckBox.DataBindings.Add("CheckState", this.viewModel, "IncludeChecksum");
                this.includeIndexCheckBox.DataBindings.Add("CheckState", this.viewModel, "IncludeIndex");
                this.includePcCheckBox.DataBindings.Add("CheckState", this.viewModel, "IncludePC");
                this.includeTransponderRssiCheckBox.DataBindings.Add("CheckState", this.viewModel, "IncludeTransponderRssi");

                this.trackBar1.DataBindings.Add("Value", this.viewModel, "OutputPower");
                this.trackBar1.ValueChanged += delegate(object sender, EventArgs e)
                {
                    // Update the label with the value of the track bar as it changes
                    this.outputPowerLabel.Text = string.Format(
                            System.Globalization.CultureInfo.CurrentUICulture,
                            "Carrier output power {0}dBm",
                            this.trackBar1.Value);
                };
            }
        }
    }
}
