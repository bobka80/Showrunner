//-----------------------------------------------------------------------
// <copyright file="TransponderParametersUserControl.cs" company="Technology Solutions UK Ltd"> 
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
    /// View to edit transponder parameters
    /// </summary>
    public partial class TransponderParametersUserControl
        : UserControl
    {
        /// <summary>
        /// View model for transponder parameters
        /// </summary>
        private TransponderParametersViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the TransponderParametersUserControl class
        /// </summary>
        public TransponderParametersUserControl()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<TransponderParametersViewModel>();

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                // ITransponderParameters
                this.includeChecksumCheckBox.BindCheckState(this.viewModel, "IncludeChecksum");
                this.includeIndexCheckBox.BindCheckState(this.viewModel, "IncludeIndex");
                this.includePcCheckBox.BindCheckState(this.viewModel, "IncludePC");
                this.includeTransponderRssiCheckBox.BindCheckState(this.viewModel, "IncludeTransponderRssi");
            }
        }
    }
}
