//-----------------------------------------------------------------------
// <copyright file="AntennaParametersUserControl.cs" company="Technology Solutions UK Ltd"> 
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
    /// User control to edit the antenna parameters used for various commands
    /// </summary>
    public partial class AntennaParametersUserControl 
        : UserControl
    {
        /// <summary>
        /// View mdoel for the antenna parameters
        /// </summary>
        private AntennaParametersViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the AntennaParametersUserControl class
        /// </summary>
        public AntennaParametersUserControl()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<AntennaParametersViewModel>();

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                // IAntennaParameters
                this.outputPowerTrackBar.DataBindings.Add("Value", this.viewModel, "OutputPower");
                this.outputPowerTrackBar.ValueChanged += delegate(object sender, EventArgs e)
                {
                    // Update the label with the value of the track bar as it changes
                    this.outputPowerLabel.Text = string.Format(
                            System.Globalization.CultureInfo.CurrentUICulture,
                            "Carrier output power {0}dBm",
                            this.outputPowerTrackBar.Value);
                };
            }
        }
    }
}
