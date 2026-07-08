//-----------------------------------------------------------------------
// <copyright file="BarcodeUserControl.cs" company="Technology Solutions UK Ltd"> 
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
    /// Displays control to perform barcode commands
    /// </summary>
    public partial class BarcodeUserControl
        : UserControl
    {
        /// <summary>
        /// Container to hold bindings between controls and ICommands
        /// </summary>
        private List<CommandBinder> commandBindings;

        /// <summary>
        /// View model to perform the actions
        /// </summary>
        private BarcodeViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the BarcodeUserControl class
        /// </summary>
        public BarcodeUserControl()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<BarcodeViewModel>();

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();

                this.scanTimeNumericUpDown.DataBindings.Add("Value", this.viewModel, "Timeout");
                this.commandBindings.Add(new ButtonBinder(this.scanBarcodeAsynchronousButton, this.viewModel.BarcodeAsynchronous));
                this.commandBindings.Add(new ButtonBinder(this.scanBarcodeButton, this.viewModel.BarcodeSynchronous));
            }
        }
    }
}
