//-----------------------------------------------------------------------
// <copyright file="IdentifiedItemsUserControl.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
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
    /// UserControl to display unique transponders scanned
    /// </summary>
    public partial class IdentifiedItemsUserControl 
        : UserControl
    {
        /// <summary>
        /// Provides information to the view
        /// </summary>
        private IdentifiedItemsViewModel viewModel;

        /// <summary>
        /// Binds the TreeView to the view model
        /// </summary>
        private InventoryViewManager viewManager;

        /// <summary>
        /// Holds the command bindings
        /// </summary>
        private List<CommandBinder> commandBindings;

        /// <summary>
        /// Initializes a new instance of the IdentifiedItemsUserControl class
        /// </summary>
        public IdentifiedItemsUserControl()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<IdentifiedItemsViewModel>();

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();
                this.viewModel.Update += this.ViewModel_Update; // TODO: databind observable list

                this.viewManager = new InventoryViewManager(this.itemsTreeView);

                this.BindFormat(this.passCountLabel, "PassCount", "0 Pass Count");
                this.BindFormat(this.passUniqueTitleLabel, "PassUniqueTranspondersCount", "0 Pass Unique");
                this.BindFormat(this.passTotalTitleLabel, "PassTotalTranspondersCount", "0 Pass Total");
                this.BindFormat(this.uniqueTranspondersTitleLabel, "UniqueTranspondersCount", "0 Total Unique Transpnders");
                this.BindFormat(this.totalTranspondersTitleLabel, "TotalTranspondersCount", "0 Total Transponders");

                this.commandBindings.Bind(this.clearButton, this.viewModel.ClearListCommand);
                this.commandBindings.Bind(this.saveButton, this.viewModel.SaveListCommand);
            }
        }

        private void BindFormat(Label label, string dataMember, string format)
        {
            label.DataBindings.Add(
                "Text",
                this.viewModel,
                dataMember,
                true,
                DataSourceUpdateMode.OnPropertyChanged,
                0,
                format);
        }

        private void ViewModel_Update(object sender, InventoryViewEventArgs e)
        {
            this.viewManager.UpdateView(e.Items, e.IsReset);
        }
    }
}
